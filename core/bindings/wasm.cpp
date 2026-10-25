// JavaScript bindings for the C++ domain. Only this file knows about Emscripten.
#include <emscripten/bind.h>

#include "stopmotion/motion.hpp"

using namespace emscripten;
using namespace stopmotion;

EMSCRIPTEN_BINDINGS(stop_motion_core) {
  value_object<Vec3>("Vec3").field("x", &Vec3::x).field("y", &Vec3::y).field("z", &Vec3::z);
  value_object<Waypoint>("Waypoint").field("time", &Waypoint::time).field("position", &Waypoint::position);
  register_vector<Waypoint>("WaypointList");

  class_<Motion>("Motion")
      .constructor<Vec3, std::vector<Waypoint>>()
      .function("positionAt", &Motion::position_at);
}
