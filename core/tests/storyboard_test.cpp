#include <gtest/gtest.h>

#include <stdexcept>
#include <string>

#include "stopmotion/storyboard.hpp"

using namespace stopmotion;

namespace {

const Vec3 kOrigin{0, 0, 0};

/** Runs f and returns the message of the std::invalid_argument it throws. */
template <typename F>
std::string RefusalOf(F f) {
  try {
    f();
  } catch (const std::invalid_argument& e) {
    return e.what();
  }
  ADD_FAILURE() << "expected a refusal";
  return "";
}

TEST(Storyboard, GivesEachPlacedParticipantAReadableUniqueId) {
  Storyboard sb = place(place(place({}, "dog", kOrigin), "dog", {1, 0, 0}), "car", kOrigin);
  ASSERT_EQ(sb.participants.size(), 3u);
  EXPECT_EQ(sb.participants[0].id, "dog-1");
  EXPECT_EQ(sb.participants[1].id, "dog-2");
  EXPECT_EQ(sb.participants[2].id, "car-1");
}

TEST(Storyboard, RecordsTheCategoryOfEachParticipant) {
  Storyboard sb = place(place(place({}, "tree", kOrigin), "horse", kOrigin), "boat", kOrigin);
  EXPECT_EQ(sb.participants[0].category, Category::Landscape);
  EXPECT_EQ(sb.participants[1].category, Category::Animal);
  EXPECT_EQ(sb.participants[2].category, Category::Vehicle);
}

TEST(Storyboard, DoesNotChangeTheStoryboardItWasGiven) {
  const Storyboard before;
  place(before, "dog", kOrigin);
  EXPECT_TRUE(before.participants.empty());
}

TEST(Storyboard, RefusesToPlaceUnknownKinds) {
  EXPECT_NE(RefusalOf([] { place({}, "dragon", kOrigin); }).find("dragon"), std::string::npos);
}

TEST(Storyboard, LetsAnimalsAndVehiclesMove) {
  Storyboard sb = add_waypoint(place({}, "bird", kOrigin), "bird-1", {2, {0, 5, 0}});
  EXPECT_EQ(sb.motions.at("bird-1").size(), 1u);
}

TEST(Storyboard, RefusesToMoveLandscape) {
  Storyboard sb = place({}, "mountain", kOrigin);
  EXPECT_EQ(RefusalOf([&] { add_waypoint(sb, "mountain-1", {1, kOrigin}); }),
            "mountain-1 is landscape and cannot move");
}

TEST(Storyboard, RefusesWaypointsAtNegativeTimes) {
  Storyboard sb = place({}, "dog", kOrigin);
  EXPECT_EQ(RefusalOf([&] { add_waypoint(sb, "dog-1", {-1, kOrigin}); }), "Waypoint time must be 0 or more, got -1");
}

TEST(Storyboard, CanRepositionAnyParticipantLandscapeIncluded) {
  Storyboard sb = reposition(place({}, "mountain", kOrigin), "mountain-1", {4, 0, -2});
  EXPECT_DOUBLE_EQ(sb.participants[0].position.x, 4);
  EXPECT_DOUBLE_EQ(sb.participants[0].position.z, -2);
}

TEST(Storyboard, KeepsTheMotionWhenRepositioning) {
  Storyboard sb = add_waypoint(place({}, "dog", kOrigin), "dog-1", {2, {10, 0, 0}});
  sb = reposition(sb, "dog-1", {1, 0, 1});
  EXPECT_EQ(sb.motions.at("dog-1").size(), 1u);
}

TEST(Storyboard, RefusesToRepositionParticipantsThatAreNotInTheStory) {
  EXPECT_EQ(RefusalOf([] { reposition({}, "ghost-1", kOrigin); }), "No participant called ghost-1 in this story");
}

TEST(Storyboard, RefusesEventsAboutParticipantsThatAreNotInTheStory) {
  EXPECT_EQ(RefusalOf([] { add_event({}, {EventType::Stop, "ghost-1", 1, 1}); }),
            "No participant called ghost-1 in this story");
}

TEST(Storyboard, AcceptsWeatherEventsThatConcernNobodyInParticular) {
  EXPECT_EQ(add_event({}, {EventType::Rain, "", 2, 0}).events.size(), 1u);
}

TEST(Storyboard, RefusesEventsAtNegativeTimes) {
  EXPECT_EQ(RefusalOf([] { add_event({}, {EventType::Rain, "", -0.5, 0}); }), "Event time must be 0 or more, got -0.5");
}

}  // namespace
