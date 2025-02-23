#!/usr/bin/env bash
# exit on error
set -o errexit

set -x

# Install yarn if not available
if ! command -v yarn &> /dev/null; then
  echo "Installing yarn..."
  npm install -g yarn
fi

echo "Installing node modules..."
yarn install

echo "Starting bundle install..."
bundle install

echo "Starting asset precompilation..."
bundle exec rake assets:precompile

echo "Cleaning assets..."
bundle exec rake assets:clean

echo "Running database migrations..."
bundle exec rake db:migrate