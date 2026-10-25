#pragma once

#include <map>
#include <string>
#include <vector>

#include "stopmotion/motion.hpp"
#include "stopmotion/participants.hpp"

namespace stopmotion {

enum class EventType { Stop, Vanish, Rain };

/** Something unexpected: a participant stops for a while, vanishes, or it starts to rain. */
struct IncidentEvent {
  EventType type = EventType::Rain;
  std::string participant_id;  // empty for rain
  double at = 0;
  double duration = 0;  // stop only
};

/** Everything a child has decided: who is where, how they move, and what happens. */
struct Storyboard {
  std::vector<Participant> participants;
  std::map<std::string, std::vector<Waypoint>> motions;
  std::vector<IncidentEvent> events;
};

// Each operation returns a new storyboard and leaves the given one unchanged.
// Rule violations throw std::invalid_argument with a message a child can read.

/** Step 1 of the process flow: put a participant somewhere in the world. */
Storyboard place(const Storyboard& sb, const std::string& kind, Vec3 position);

/** Step 1 again: put an already placed participant somewhere else. Its motion is kept. */
Storyboard reposition(const Storyboard& sb, const std::string& participant_id, Vec3 position);

/** Step 2: tell a participant where to be at a given time. */
Storyboard add_waypoint(const Storyboard& sb, const std::string& participant_id, Waypoint waypoint);

/** Step 3: something unexpected happens. */
Storyboard add_event(const Storyboard& sb, IncidentEvent event);

}  // namespace stopmotion
