#include "stopmotion/motion.hpp"

#include <algorithm>
#include <utility>

namespace stopmotion {

namespace {

double lerp(double a, double b, double f) { return a + (b - a) * f; }

}  // namespace

Motion::Motion(Vec3 start, std::vector<Waypoint> waypoints) {
  // Stable sort keeps waypoints at equal times in the order they were added.
  std::stable_sort(waypoints.begin(), waypoints.end(),
                   [](const Waypoint& a, const Waypoint& b) { return a.time < b.time; });
  path_.reserve(waypoints.size() + 1);
  path_.push_back({0, start});
  path_.insert(path_.end(), waypoints.begin(), waypoints.end());
}

Vec3 Motion::position_at(double t) const {
  for (std::size_t i = 1; i < path_.size(); ++i) {
    const Waypoint& from = path_[i - 1];
    const Waypoint& to = path_[i];
    if (t <= to.time) {
      const double span = to.time - from.time;
      const double f = span == 0 ? 1 : std::max(0.0, (t - from.time) / span);
      return {lerp(from.position.x, to.position.x, f),
              lerp(from.position.y, to.position.y, f),
              lerp(from.position.z, to.position.z, f)};
    }
  }
  return path_.back().position;
}

}  // namespace stopmotion
