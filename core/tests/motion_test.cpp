#include <gtest/gtest.h>

#include "stopmotion/motion.hpp"

using stopmotion::Motion;
using stopmotion::Vec3;
using stopmotion::Waypoint;

namespace {

const Vec3 kStart{0, 0, 0};

void ExpectAt(const Vec3& actual, const Vec3& expected) {
  EXPECT_DOUBLE_EQ(actual.x, expected.x);
  EXPECT_DOUBLE_EQ(actual.y, expected.y);
  EXPECT_DOUBLE_EQ(actual.z, expected.z);
}

TEST(Motion, StaysAtTheStartWhenThereAreNoWaypoints) {
  ExpectAt(Motion(kStart, {}).position_at(3), kStart);
}

TEST(Motion, InterpolatesLinearlyFromTheStartToTheFirstWaypoint) {
  Motion motion(kStart, {{2, {10, 0, 4}}});
  ExpectAt(motion.position_at(1), {5, 0, 2});
}

TEST(Motion, InterpolatesBetweenTwoWaypoints) {
  Motion motion(kStart, {{1, {2, 0, 0}}, {3, {6, 0, 0}}});
  ExpectAt(motion.position_at(2), {4, 0, 0});
}

TEST(Motion, HoldsTheLastWaypointAfterTheMotionEnds) {
  Motion motion(kStart, {{1, {2, 1, 0}}});
  ExpectAt(motion.position_at(99), {2, 1, 0});
}

TEST(Motion, DoesNotDependOnTheOrderWaypointsWereAdded) {
  Motion motion(kStart, {{3, {6, 0, 0}}, {1, {2, 0, 0}}});
  ExpectAt(motion.position_at(2), {4, 0, 0});
}

TEST(Motion, StaysAtTheStartBeforeTimeZero) {
  Motion motion(kStart, {{2, {10, 0, 0}}});
  ExpectAt(motion.position_at(-1), kStart);
}

TEST(Motion, JumpsToAWaypointPlacedAtTimeZero) {
  Motion motion(kStart, {{0, {5, 0, 0}}});
  ExpectAt(motion.position_at(0), {5, 0, 0});
}

}  // namespace
