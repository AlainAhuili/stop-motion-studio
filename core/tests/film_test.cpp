#include <gtest/gtest.h>

#include <stdexcept>
#include <vector>

#include "stopmotion/film.hpp"

using namespace stopmotion;

namespace {

const Vec3 kOrigin{0, 0, 0};

Storyboard DogRunningTenMetresInTwoSeconds() {
  return add_waypoint(place({}, "dog", kOrigin), "dog-1", {2, {10, 0, 0}});
}

const Frame& FrameAt(const Film& film, double time) {
  for (const Frame& f : film.frames) {
    if (f.time == time) return f;
  }
  throw std::out_of_range("no frame at that time");
}

TEST(Film, HasOneFramePerTickIncludingTheFirstAndLast) {
  Film film = generate_film(DogRunningTenMetresInTwoSeconds(), 4);
  ASSERT_EQ(film.frames.size(), 9u);
  EXPECT_EQ(film.frames.back().time, 2);
  EXPECT_EQ(film.frames.back().index, 8u);
}

TEST(Film, LastsUntilTheLastMotionEndsAndAtLeastOneSecond) {
  EXPECT_EQ(generate_film(DogRunningTenMetresInTwoSeconds(), 1).duration, 2);
  EXPECT_EQ(generate_film({}, 1).duration, 1);
}

TEST(Film, PlacesEveryParticipantInEveryFrame) {
  Storyboard sb = place(DogRunningTenMetresInTwoSeconds(), "tree", {3, 0, 3});
  const Film film = generate_film(sb, 2);
  const Frame& middle = film.frames[2];
  ASSERT_EQ(middle.actors.size(), 2u);
  EXPECT_DOUBLE_EQ(middle.actors[0].position.x, 5);
  EXPECT_DOUBLE_EQ(middle.actors[1].position.x, 3);
  EXPECT_DOUBLE_EQ(middle.actors[1].position.z, 3);
  EXPECT_TRUE(middle.actors[0].visible);
}

TEST(Film, AStoppedParticipantCarriesOnFromWhereItStopped) {
  Storyboard sb = add_event(DogRunningTenMetresInTwoSeconds(), {EventType::Stop, "dog-1", 1, 1});
  Film film = generate_film(sb, 2);
  EXPECT_EQ(film.duration, 3);
  std::vector<double> xs;
  for (double t : {0.5, 1.0, 1.5, 2.0, 2.5, 3.0}) xs.push_back(FrameAt(film, t).actors[0].position.x);
  EXPECT_EQ(xs, (std::vector<double>{2.5, 5, 5, 5, 7.5, 10}));
}

TEST(Film, AVanishEventHidesAParticipantFromThenOn) {
  Storyboard sb = add_event(DogRunningTenMetresInTwoSeconds(), {EventType::Vanish, "dog-1", 1, 0});
  std::vector<bool> visible;
  for (const Frame& f : generate_film(sb, 2).frames) visible.push_back(f.actors[0].visible);
  EXPECT_EQ(visible, (std::vector<bool>{true, true, false, false, false}));
}

TEST(Film, ARainEventChangesTheWeatherFromThenOn) {
  Storyboard sb = add_event(DogRunningTenMetresInTwoSeconds(), {EventType::Rain, "", 1.5, 0});
  std::vector<Weather> weather;
  for (const Frame& f : generate_film(sb, 2).frames) weather.push_back(f.weather);
  EXPECT_EQ(weather, (std::vector<Weather>{Weather::Clear, Weather::Clear, Weather::Clear, Weather::Rain, Weather::Rain}));
}

TEST(Film, RefusesAFrameRateAFilmCannotHave) {
  EXPECT_THROW(generate_film({}, 0), std::invalid_argument);
}

}  // namespace
