#pragma once

#include <vector>

namespace stopmotion {

struct Vec3 {
  double x = 0;
  double y = 0;
  double z = 0;
};

struct Waypoint {
  double time = 0;
  Vec3 position;
};

/** A participant's path: its start position at time 0, then its waypoints in time order. */
class Motion {
 public:
  Motion(Vec3 start, std::vector<Waypoint> waypoints);

  /** Where the participant is at time t: linear between waypoints, holding still after the last. */
  Vec3 position_at(double t) const;

 private:
  std::vector<Waypoint> path_;
};

}  // namespace stopmotion
