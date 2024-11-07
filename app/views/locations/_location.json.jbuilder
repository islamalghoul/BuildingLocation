json.extract! location, :id, :street, :city, :state, :country, :latitude, :longitude, :created_at, :updated_at
json.url location_url(location, format: :json)
