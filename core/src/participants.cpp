#include "stopmotion/participants.hpp"

#include <algorithm>
#include <stdexcept>

namespace stopmotion {

const std::vector<std::pair<Category, std::vector<std::string>>>& catalogue() {
  static const std::vector<std::pair<Category, std::vector<std::string>>> groups{
      {Category::Landscape, {"tree", "road", "mountain", "forest", "lake", "sea", "river", "sun"}},
      {Category::Animal, {"human", "dog", "bird", "fish", "horse"}},
      {Category::Vehicle, {"car", "plane", "boat", "bicycle"}},
  };
  return groups;
}

Category category_of(const std::string& kind) {
  for (const auto& [category, kinds] : catalogue()) {
    if (std::find(kinds.begin(), kinds.end(), kind) != kinds.end()) return category;
  }
  throw std::invalid_argument("Unknown participant kind: " + kind);
}

bool can_move(Category category) { return category != Category::Landscape; }

std::string to_string(Category category) {
  switch (category) {
    case Category::Landscape:
      return "landscape";
    case Category::Animal:
      return "animal";
    case Category::Vehicle:
      return "vehicle";
  }
  return "";
}

}  // namespace stopmotion
