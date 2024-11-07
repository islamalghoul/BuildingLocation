class CreateLocations < ActiveRecord::Migration[6.1]
  def change
    create_table :locations do |t|
      t.string :street
      t.string :city
      t.string :state
      t.string :country
      t.decimal "latitude", precision: 10, scale: 6
      t.decimal "longitude", precision: 10, scale: 6
      t.timestamps
    end
  end
end
