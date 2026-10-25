#pragma once

#include <string>
#include <utility>
#include <vector>

#include "stopmotion/motion.hpp"

namespace stopmotion {

enum class Category { Landscape, Animal, Vehicle };

struct Participant {
  std::string id;
  std::string kind;
  Category category = Category::Landscape;
  Vec3 position;
};

/** Every kind of participant a child can place, grouped by category, in display order. */
const std::vector<std::pair<Category, std::vector<std::string>>>& catalogue();

/** The category a kind belongs to. Throws std::invalid_argument for an unknown kind. */
Category category_of(const std::string& kind);

/** Landscape stays where it is placed; animals and vehicles can move. */
bool can_move(Category category);

/** "landscape", "animal" or "vehicle". */
std::string to_string(Category category);

}  // namespace stopmotion
