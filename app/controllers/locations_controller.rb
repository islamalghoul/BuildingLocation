class LocationsController < ApplicationController
  before_action :set_location, only: %i[ show edit update destroy ]

  # GET /locations or /locations.json
  def index
    @locations = Location.all
  end

  # POST /locations or /locations.json
  def create
    @location = Location.new(location_params)
  
    respond_to do |format|
      if @location.save
        format.json { render json: @location, status: :created }
      else
        format.json { render json: @location.errors, status: :unprocessable_entity }
      end
    end
  end
  

  # PATCH/PUT /locations/1 or /locations/1.json
  def update
    respond_to do |format|
      if @location.update(location_params)
        format.json { render json: @location, status: :ok }
      else
        format.json { render json: @location.errors, status: :unprocessable_entity }
      end
    end
  end
  

  # DELETE /locations/1 or /locations/1.json
  def destroy
    @location.destroy

    respond_to do |format|
      format.html { redirect_to locations_path, status: :see_other, notice: "Location was successfully destroyed." }
      format.json { head :no_content }
    end
  end
  
  private
    def set_location
      @location = Location.find(params[:id])
    end

    def location_params
      params.require(:location).permit(:street, :city, :state, :country, :latitude, :longitude)
    end
end
