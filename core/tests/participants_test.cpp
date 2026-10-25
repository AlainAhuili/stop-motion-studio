#include <gtest/gtest.h>

#include <stdexcept>

#include "stopmotion/participants.hpp"

using namespace stopmotion;

namespace {

TEST(Participants, TheCatalogueHasLandscapeAnimalsAndVehiclesInThatOrder) {
  const auto& groups = catalogue();
  ASSERT_EQ(groups.size(), 3u);
  EXPECT_EQ(groups[0].first, Category::Landscape);
  EXPECT_EQ(groups[1].first, Category::Animal);
  EXPECT_EQ(groups[2].first, Category::Vehicle);
  EXPECT_EQ(groups[1].second, (std::vector<std::string>{"human", "dog", "bird", "fish", "horse"}));
}

TEST(Participants, KnowsTheCategoryOfEachKind) {
  EXPECT_EQ(category_of("mountain"), Category::Landscape);
  EXPECT_EQ(category_of("horse"), Category::Animal);
  EXPECT_EQ(category_of("bicycle"), Category::Vehicle);
}

TEST(Participants, RefusesUnknownKinds) {
  EXPECT_THROW(category_of("dragon"), std::invalid_argument);
}

TEST(Participants, OnlyAnimalsAndVehiclesCanMove) {
  EXPECT_FALSE(can_move(Category::Landscape));
  EXPECT_TRUE(can_move(Category::Animal));
  EXPECT_TRUE(can_move(Category::Vehicle));
}

TEST(Participants, NamesCategoriesForPeople) {
  EXPECT_EQ(to_string(Category::Landscape), "landscape");
  EXPECT_EQ(to_string(Category::Vehicle), "vehicle");
}

}  // namespace
