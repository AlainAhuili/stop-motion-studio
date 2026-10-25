// JavaScript bindings for the C++ domain. Only this file knows about Emscripten.
// Storyboards cross the boundary as plain JavaScript objects; films as flat typed arrays.
#include <emscripten/bind.h>

#include <exception>
#include <string>
#include <vector>

#include "stopmotion/film.hpp"
#include "stopmotion/motion.hpp"
#include "stopmotion/storyboard.hpp"

using namespace emscripten;
using namespace stopmotion;

namespace {

// ---- JavaScript -> C++ ----

Vec3 vec3_from(const val& v) { return {v["x"].as<double>(), v["y"].as<double>(), v["z"].as<double>()}; }

Waypoint waypoint_from(const val& w) { return {w["time"].as<double>(), vec3_from(w["position"])}; }

EventType event_type_from(const std::string& type) {
  if (type == "stop") return EventType::Stop;
  if (type == "vanish") return EventType::Vanish;
  if (type == "rain") return EventType::Rain;
  throw std::invalid_argument("Unknown incident type: " + type);
}

IncidentEvent event_from(const val& e) {
  IncidentEvent event;
  event.type = event_type_from(e["type"].as<std::string>());
  event.at = e["at"].as<double>();
  if (!e["participantId"].isUndefined()) event.participant_id = e["participantId"].as<std::string>();
  if (!e["duration"].isUndefined()) event.duration = e["duration"].as<double>();
  return event;
}

template <typename T, typename F>
std::vector<T> vector_from(const val& array, F convert) {
  std::vector<T> out;
  const auto length = array["length"].as<unsigned>();
  out.reserve(length);
  for (unsigned i = 0; i < length; ++i) out.push_back(convert(array[i]));
  return out;
}

Storyboard storyboard_from(const val& sb) {
  Storyboard out;
  out.participants = vector_from<Participant>(sb["participants"], [](const val& p) {
    const auto kind = p["kind"].as<std::string>();
    return Participant{p["id"].as<std::string>(), kind, category_of(kind), vec3_from(p["position"])};
  });
  const val motions = sb["motions"];
  for (const val& id : vector_from<val>(val::global("Object").call<val>("keys", motions), [](const val& k) { return k; })) {
    out.motions[id.as<std::string>()] = vector_from<Waypoint>(motions[id], waypoint_from);
  }
  out.events = vector_from<IncidentEvent>(sb["events"], event_from);
  return out;
}

// ---- C++ -> JavaScript ----

val to_js(const Vec3& v) {
  val out = val::object();
  out.set("x", v.x);
  out.set("y", v.y);
  out.set("z", v.z);
  return out;
}

template <typename T, typename F>
val array_of(const std::vector<T>& items, F convert) {
  val out = val::array();
  for (const T& item : items) out.call<void>("push", convert(item));
  return out;
}

const char* to_js(EventType type) {
  switch (type) {
    case EventType::Stop:
      return "stop";
    case EventType::Vanish:
      return "vanish";
    case EventType::Rain:
      return "rain";
  }
  return "";
}

val to_js(const Storyboard& sb) {
  val out = val::object();
  out.set("participants", array_of(sb.participants, [](const Participant& p) {
    val js = val::object();
    js.set("id", p.id);
    js.set("kind", p.kind);
    js.set("category", to_string(p.category));
    js.set("position", to_js(p.position));
    return js;
  }));
  val motions = val::object();
  for (const auto& [id, waypoints] : sb.motions) {
    motions.set(id, array_of(waypoints, [](const Waypoint& w) {
      val js = val::object();
      js.set("time", w.time);
      js.set("position", to_js(w.position));
      return js;
    }));
  }
  out.set("motions", motions);
  out.set("events", array_of(sb.events, [](const IncidentEvent& e) {
    val js = val::object();
    js.set("type", std::string(to_js(e.type)));
    if (e.type != EventType::Rain) js.set("participantId", e.participant_id);
    js.set("at", e.at);
    if (e.type == EventType::Stop) js.set("duration", e.duration);
    return js;
  }));
  return out;
}

/** A copy of a C++ vector as a JavaScript typed array, so it outlives the C++ memory. */
template <typename T>
val typed_array(const std::vector<T>& values) {
  return val(typed_memory_view(values.size(), values.data())).call<val>("slice");
}

/** Runs a domain operation, turning a refused rule into an ordinary JavaScript Error. */
template <typename F>
val guarded(F operation) {
  try {
    return operation();
  } catch (const std::exception& e) {
    val::global("Error").new_(std::string(e.what())).throw_();
  }
}

// ---- The functions JavaScript calls ----

val catalogue_js() {
  val out = val::object();
  for (const auto& [category, kinds] : catalogue()) {
    out.set(to_string(category), array_of(kinds, [](const std::string& k) { return val(k); }));
  }
  return out;
}

val category_of_js(const std::string& kind) {
  return guarded([&] { return val(to_string(category_of(kind))); });
}

bool can_move_js(const std::string& category) {
  return can_move(category == "landscape" ? Category::Landscape : Category::Animal);
}

val empty_storyboard_js() { return to_js(Storyboard{}); }

val place_js(const val& sb, const std::string& kind, const val& position) {
  return guarded([&] { return to_js(place(storyboard_from(sb), kind, vec3_from(position))); });
}

val reposition_js(const val& sb, const std::string& id, const val& position) {
  return guarded([&] { return to_js(reposition(storyboard_from(sb), id, vec3_from(position))); });
}

val add_waypoint_js(const val& sb, const std::string& id, const val& waypoint) {
  return guarded([&] { return to_js(add_waypoint(storyboard_from(sb), id, waypoint_from(waypoint))); });
}

val add_event_js(const val& sb, const val& event) {
  return guarded([&] { return to_js(add_event(storyboard_from(sb), event_from(event))); });
}

val position_at_js(const val& start, const val& waypoints, double t) {
  return guarded([&] { return to_js(Motion(vec3_from(start), vector_from<Waypoint>(waypoints, waypoint_from)).position_at(t)); });
}

/**
 * The film as flat arrays: for frame f and actor a (actors in participant order),
 * position = positions[(f * actors + a) * 3 + 0..2] and visible = visible[f * actors + a].
 */
val generate_film_js(const val& sb, double fps) {
  return guarded([&] {
    const Film film = generate_film(storyboard_from(sb), fps);
    const std::size_t actors = film.frames.empty() ? 0 : film.frames.front().actors.size();
    std::vector<double> times, positions;
    std::vector<std::uint8_t> visible, rain;
    times.reserve(film.frames.size());
    positions.reserve(film.frames.size() * actors * 3);
    visible.reserve(film.frames.size() * actors);
    for (const Frame& frame : film.frames) {
      times.push_back(frame.time);
      rain.push_back(frame.weather == Weather::Rain ? 1 : 0);
      for (const Actor& actor : frame.actors) {
        positions.insert(positions.end(), {actor.position.x, actor.position.y, actor.position.z});
        visible.push_back(actor.visible ? 1 : 0);
      }
    }
    val out = val::object();
    out.set("fps", film.fps);
    out.set("duration", film.duration);
    out.set("actors", actors);
    out.set("times", typed_array(times));
    out.set("rain", typed_array(rain));
    out.set("positions", typed_array(positions));
    out.set("visible", typed_array(visible));
    return out;
  });
}

}  // namespace

EMSCRIPTEN_BINDINGS(stop_motion_core) {
  function("catalogue", &catalogue_js);
  function("categoryOf", &category_of_js);
  function("canMove", &can_move_js);
  function("emptyStoryboard", &empty_storyboard_js);
  function("place", &place_js);
  function("reposition", &reposition_js);
  function("addWaypoint", &add_waypoint_js);
  function("addEvent", &add_event_js);
  function("positionAt", &position_at_js);
  function("generateFilm", &generate_film_js);
}
