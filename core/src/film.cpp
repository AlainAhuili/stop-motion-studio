#include "stopmotion/film.hpp"

#include <algorithm>
#include <cmath>
#include <limits>
#include <cstdio>
#include <string>
#include <stdexcept>

namespace stopmotion {

namespace {

constexpr double kNever = std::numeric_limits<double>::infinity();

/** Everything about one participant that the film needs, worked out once rather than per frame. */
struct Role {
  Motion motion;
  std::vector<IncidentEvent> stops;
  double vanish_at = kNever;
};

/** How long a participant has spent stopped up to time t. */
double frozen_time(const std::vector<IncidentEvent>& stops, double t) {
  double sum = 0;
  for (const IncidentEvent& s : stops) sum += std::min(std::max(t - s.at, 0.0), s.duration);
  return sum;
}

double film_duration(const Storyboard& sb) {
  double duration = 1;
  for (const Participant& p : sb.participants) {
    double end = 0;
    if (auto it = sb.motions.find(p.id); it != sb.motions.end()) {
      for (const Waypoint& w : it->second) end = std::max(end, w.time);
    }
    for (const IncidentEvent& e : sb.events) {
      if (e.type == EventType::Stop && e.participant_id == p.id) end += e.duration;
    }
    duration = std::max(duration, end);
  }
  for (const IncidentEvent& e : sb.events) {
    duration = std::max(duration, e.at + (e.type == EventType::Stop ? e.duration : 0));
  }
  return duration;
}

}  // namespace

Film generate_film(const Storyboard& sb, double fps) {
  if (!(fps > 0)) {
    char got[32];
    std::snprintf(got, sizeof got, "%g", fps);
    throw std::invalid_argument(std::string("fps must be greater than 0, got ") + got);
  }

  double rain_at = kNever;
  std::vector<Role> cast;
  cast.reserve(sb.participants.size());
  for (const Participant& p : sb.participants) {
    auto motion = sb.motions.find(p.id);
    Role role{Motion(p.position, motion == sb.motions.end() ? std::vector<Waypoint>{} : motion->second), {}, kNever};
    for (const IncidentEvent& e : sb.events) {
      if (e.participant_id != p.id) continue;
      if (e.type == EventType::Stop) role.stops.push_back(e);
      if (e.type == EventType::Vanish) role.vanish_at = std::min(role.vanish_at, e.at);
    }
    cast.push_back(std::move(role));
  }
  for (const IncidentEvent& e : sb.events) {
    if (e.type == EventType::Rain) rain_at = std::min(rain_at, e.at);
  }

  Film film;
  film.fps = fps;
  film.duration = film_duration(sb);
  const auto count = static_cast<std::size_t>(std::floor(film.duration * fps + 1e-9)) + 1;
  film.frames.reserve(count);

  for (std::size_t index = 0; index < count; ++index) {
    Frame frame;
    frame.index = index;
    frame.time = std::round(static_cast<double>(index) / fps * 1e6) / 1e6;
    frame.weather = frame.time >= rain_at ? Weather::Rain : Weather::Clear;
    frame.actors.reserve(cast.size());
    for (const Role& role : cast) {
      frame.actors.push_back({role.motion.position_at(frame.time - frozen_time(role.stops, frame.time)),
                              frame.time < role.vanish_at});
    }
    film.frames.push_back(std::move(frame));
  }
  return film;
}

}  // namespace stopmotion
