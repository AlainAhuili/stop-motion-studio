#pragma once

#include <cstddef>
#include <vector>

#include "stopmotion/storyboard.hpp"

namespace stopmotion {

enum class Weather { Clear, Rain };

/** One participant in one frame. Actors appear in the same order as the storyboard's participants. */
struct Actor {
  Vec3 position;
  bool visible = true;
};

struct Frame {
  std::size_t index = 0;
  double time = 0;
  Weather weather = Weather::Clear;
  std::vector<Actor> actors;
};

struct Film {
  double fps = 0;
  double duration = 0;
  std::vector<Frame> frames;
};

/** Generates the film: every participant's state, frame by frame. Throws for fps <= 0. */
Film generate_film(const Storyboard& sb, double fps);

}  // namespace stopmotion
