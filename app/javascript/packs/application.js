// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
//= require locations.js


Rails.start()
Turbolinks.start()
ActiveStorage.start()

document.addEventListener("DOMContentLoaded", function () {
    let map;
    let marker;
    let isEventListenerAdded = false;
    // Initialize the map when the modal is opened
    const locationModal = document.getElementById('locationModal');
    locationModal.addEventListener('shown.bs.modal', function () {
        if (!map) {
            map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: 37.7749, lng: -122.4194 },
                zoom: 10,
            });
        } else {
            // Trigger resize when the modal is shown
            google.maps.event.trigger(map, "resize");
        }

        const getLocationBtn = document.getElementById('getLocationBtn');
        getLocationBtn.addEventListener('click', function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    const currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(currentLocation);
                    map.setZoom(15);
                    if (marker) {
                        marker.setPosition(currentLocation);
                    } else {
                        marker = new google.maps.Marker({
                            position: currentLocation,
                            map: map,
                            title: "Current Location"
                        });
                    }
                    updateAddressByCoordinates(currentLocation);
                }, function () {
                    alert("Error: The geolocation service failed.");
                });
            } else {
                alert("Error: Your browser does not support geolocation.");
            }
        });

        const input = document.getElementById('locationSearch');
        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.setTypes(['geocode']);
        const autocompleteResults = document.getElementById("autocomplete-results");

        input.addEventListener('input', function () {
            const query = input.value;
            if (query.length > 0) {
                const service = new google.maps.places.AutocompleteService();
                service.getPlacePredictions({ input: query, types: ['geocode'] }, function (predictions, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        autocompleteResults.innerHTML = "";
                        autocompleteResults.style.display = "block";
                        predictions.forEach(function (prediction) {
                            const li = document.createElement("li");
                            li.classList.add("list-group-item");
                            li.textContent = prediction.description;
                            li.addEventListener("click", function () {
                                input.value = prediction.description;
                                autocompleteResults.style.display = "none";
                                const place = prediction.place_id;
                                const placesService = new google.maps.places.PlacesService(map);
                                placesService.getDetails({ placeId: place }, function (placeDetails, status) {
                                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                                        map.setCenter(placeDetails.geometry.location);
                                        map.setZoom(15);
                                        if (marker) {
                                            marker.setMap(null);
                                        }
                                        marker = new google.maps.Marker({
                                            position: placeDetails.geometry.location,
                                            map: map,
                                        });
                                        displayLocationDetails(placeDetails);
                                    }
                                });
                            });
                            autocompleteResults.appendChild(li);
                        });
                    }
                });
            } else {
                autocompleteResults.style.display = "none";
            }
        });

        autocomplete.addListener('place_changed', function () {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                alert("No details available for this place.");
                return;
            }
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            if (marker) {
                marker.setPosition(place.geometry.location);
            } else {
                marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name
                });
            }
            displayLocationDetails(place);
        });

        map.addListener("click", function(event) {
            const clickedLocation = event.latLng;
            if (marker) {
                marker.setPosition(clickedLocation);
            } else {
                marker = new google.maps.Marker({
                    position: clickedLocation,
                    map: map,
                });
            }
            updateAddressByCoordinates(clickedLocation);
        });
    });

    function displayLocationDetails(place) {
        const components = place.address_components || [];
        let street = 'N.A.';
        let city = 'N.A.';
        let state = 'N.A.';
        let country = 'N.A.';
        let latitude = 'N.A.';
        let longitude = 'N.A.';
    
        components.forEach((component) => {
            if (component.types.includes("route")) {
                street = component.long_name;
            } else if (component.types.includes("locality")) {
                city = component.long_name;
            } else if (component.types.includes("administrative_area_level_1")) {
                state = component.long_name;
            } else if (component.types.includes("country")) {
                country = component.long_name;
            }
        });
    
        if (place.geometry && place.geometry.location) {
            latitude = place.geometry.location.lat();
            longitude = place.geometry.location.lng();
        }
    
        const fullAddress = `${street}, ${city}, ${state}, ${country}, ${latitude}, ${longitude}`;
        document.getElementById("addressText").textContent = `Site Address: ${fullAddress}`;
    
        document.getElementById("fallbackMessage").style.display = "none";
        document.getElementById("locationContent").style.display = "block";
    
        function setLocationDetails(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    
        setLocationDetails('street', `Street: ${street}`);
        setLocationDetails('city', `City: ${city}`);
        setLocationDetails('state', `State: ${state}`);
        setLocationDetails('country', `Country: ${country}`);
        setLocationDetails('latitude', `Latitude: ${latitude}`);
        setLocationDetails('longitude', `Longitude: ${longitude}`);

        // Add click event for "Save Location"
        const saveLocationBtn = document.getElementById("creatbtn");
        if (!isEventListenerAdded) {
            saveLocationBtn.addEventListener('click', function() {
                const data = {
                    location: {
                        street: street,
                        city: city,
                        state: state,
                        country: country,
                        latitude: latitude,
                        longitude: longitude
                    }
                    
                };
                console.log(data,'lllllllll');
                
                fetch('/locations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Location saved:', data);
                    const mainContentMap = document.getElementById("mapMain");
                    mainContentMap.style.display = "block";
                    // Optionally, close the modal after saving
                    if (latitude !== 'N.A.' && longitude !== 'N.A.') {
                        const map = new google.maps.Map(mainContentMap, {
                            center: { lat: latitude, lng: longitude },
                            zoom: 14
                        });
                
                        new google.maps.Marker({
                            position: { lat: latitude, lng: longitude },
                            map: map,
                            title: fullAddress
                        });
                    } else {
                        mainContentMap.style.display = "none";
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            });
            isEventListenerAdded=true;
        }
    }
    
    function updateAddressByCoordinates(latLng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, function (results, status) {
            if (status === "OK" && results[0]) {
                displayLocationDetails(results[0]);
            } else {
                console.log("Geocoder failed due to: " + status);
                document.getElementById("fallbackMessage").style.display = "block";
                document.getElementById("locationContent").style.display = "none";
            }
        });
    }
});
