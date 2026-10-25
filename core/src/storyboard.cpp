#include "stopmotion/storyboard.hpp"

#include <algorithm>
#include <cstdio>
#include <stdexcept>

namespace stopmotion {

namespace {

// snprintf rather than iostreams: iostreams would add a large library to the WebAssembly build.
std::string number(double value) {
  char text[32];
  std::snprintf(text, sizeof text, "%g", value);
  return text;
}

const Participant& find(const Storyboard& sb, const std::string& id) {
  auto it = std::find_if(sb.participants.begin(), sb.participants.end(),
                         [&](const Participant& p) { return p.id == id; });
  if (it == sb.participants.end()) throw std::invalid_argument("No participant called " + id + " in this story");
  return *it;
}

}  // namespace

Storyboard place(const Storyboard& sb, const std::string& kind, Vec3 position) {
  const Category category = category_of(kind);
  const auto same_kind = std::count_if(sb.participants.begin(), sb.participants.end(),
                                       [&](const Participant& p) { return p.kind == kind; });
  Storyboard next = sb;
  next.participants.push_back({kind + "-" + std::to_string(same_kind + 1), kind, category, position});
  return next;
}

Storyboard reposition(const Storyboard& sb, const std::string& participant_id, Vec3 position) {
  find(sb, participant_id);
  Storyboard next = sb;
  for (Participant& p : next.participants) {
    if (p.id == participant_id) p.position = position;
  }
  return next;
}

Storyboard add_waypoint(const Storyboard& sb, const std::string& participant_id, Waypoint waypoint) {
  const Participant& participant = find(sb, participant_id);
  if (!can_move(participant.category)) {
    throw std::invalid_argument(participant_id + " is " + to_string(participant.category) + " and cannot move");
  }
  if (!(waypoint.time >= 0)) throw std::invalid_argument("Waypoint time must be 0 or more, got " + number(waypoint.time));
  Storyboard next = sb;
  next.motions[participant_id].push_back(waypoint);
  return next;
}

Storyboard add_event(const Storyboard& sb, IncidentEvent event) {
  if (event.type != EventType::Rain) find(sb, event.participant_id);
  if (!(event.at >= 0)) throw std::invalid_argument("Event time must be 0 or more, got " + number(event.at));
  Storyboard next = sb;
  next.events.push_back(std::move(event));
  return next;
}

}  // namespace stopmotion
