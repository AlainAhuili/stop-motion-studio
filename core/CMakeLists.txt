cmake_minimum_required(VERSION 3.20)
project(stop_motion_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# The domain: plain C++, no browser or UI code, so it builds natively and to WebAssembly.
add_library(stop_motion_core src/motion.cpp)
target_include_directories(stop_motion_core PUBLIC include)
if(MSVC)
  target_compile_options(stop_motion_core PRIVATE /W4 /WX)
else()
  target_compile_options(stop_motion_core PRIVATE -Wall -Wextra -Wpedantic -Werror)
endif()

if(EMSCRIPTEN)
  # WebAssembly module for the browser: an ES module with the .wasm embedded,
  # so the bundler treats it as one ordinary JavaScript file.
  add_executable(stop_motion_wasm bindings/wasm.cpp)
  target_link_libraries(stop_motion_wasm PRIVATE stop_motion_core)
  set_target_properties(stop_motion_wasm PROPERTIES OUTPUT_NAME core SUFFIX .js)
  target_link_options(stop_motion_wasm PRIVATE
    -lembind -O3
    -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createCore
    -sSINGLE_FILE=1 -sENVIRONMENT=web,node
    -sALLOW_MEMORY_GROWTH=1 -sFILESYSTEM=0)
else()
  # Native unit tests: the fast part of the commit stage.
  include(FetchContent)
  FetchContent_Declare(googletest
    URL https://github.com/google/googletest/archive/refs/tags/v1.17.0.zip
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE)
  set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
  set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
  FetchContent_MakeAvailable(googletest)

  enable_testing()
  add_executable(core_tests tests/motion_test.cpp)
  target_link_libraries(core_tests PRIVATE stop_motion_core GTest::gtest_main)
  include(GoogleTest)
  gtest_discover_tests(core_tests)
endif()
