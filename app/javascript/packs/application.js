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

document.addEventListener("DOMContentLoaded", initializeLocationApp);

let map, marker, locationID = null;
let isEventListenerAdded = false;
let isUpdateListener = false;
let locationData = {
    street: 'N.A.',
    city: 'N.A.',
    state: 'N.A.',
    country: 'N.A.',
    latitude: 'N.A.',
    longitude: 'N.A.',
    fullAddress: null
};

function initializeLocationApp() {
    setupModalListener();
    setupSaveLocationListener();
    setupUpdateLocationListener();
}

function setupModalListener() {
    const locationModal = document.getElementById('locationModal');
    locationModal.addEventListener('shown.bs.modal', () => {
        initializeMap();
        setupGeolocationButton();
        setupAutocomplete();
    });
}

function initializeMap() {
    if (!map) {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 10,
        });
    } else {
        google.maps.event.trigger(map, "resize");
    }
    map.addListener("click", event => updateMarker(event.latLng));
}

function setupGeolocationButton() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
                    map.setCenter(latLng); // Center the map on the user's location
                    map.setZoom(15); // Adjust zoom for a closer view
                    updateMarker(latLng); // Update the marker position
                },
                () => alert("Error: The geolocation service failed.")
            );
        } else {
            alert("Error: Your browser does not support geolocation.");
        }
    });
}
function setupAutocomplete() {
    const input = document.getElementById('locationSearch');
    const autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode'] });
    const autocompleteResults = document.getElementById("autocomplete-results");

    input.addEventListener('input', () => showAutocompleteResults(input.value, autocompleteResults));
    autocomplete.addListener('place_changed', () => updatePlace(autocomplete.getPlace()));
}

function showAutocompleteResults(query, autocompleteResults) {
    if (query.length > 0) {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions({ input: query, types: ['geocode'] }, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                autocompleteResults.innerHTML = "";
                autocompleteResults.style.display = "block";
                predictions.forEach(prediction => createPredictionItem(prediction, autocompleteResults));
            }
        });
    } else {
        autocompleteResults.style.display = "none";
    }
}

function createPredictionItem(prediction, autocompleteResults) {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent = prediction.description;
    li.addEventListener("click", () => {
        document.getElementById('locationSearch').value = prediction.description;
        autocompleteResults.style.display = "none";
        fetchPlaceDetails(prediction.place_id);
    });
    autocompleteResults.appendChild(li);
}

function fetchPlaceDetails(placeId) {
    const placesService = new google.maps.places.PlacesService(map);
    placesService.getDetails({ placeId: placeId }, (placeDetails, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            updatePlace(placeDetails);
        }
    });
}

function updatePlace(place) {
    if (!place.geometry) return alert("No details available for this place.");
    map.setCenter(place.geometry.location);
    map.setZoom(15);
    updateMarker(place.geometry.location);
    updateLocationDetails(place);
}

function updateMarker(latLng) {
    if (marker) {
        marker.setPosition(latLng);
    } else {
        marker = new google.maps.Marker({ position: latLng, map: map });
    }
    updateAddressByCoordinates(latLng);
}

function updateAddressByCoordinates(latLng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results[0]) {
            updateLocationDetails(results[0]);
        } else {
            document.getElementById("fallbackMessage").style.display = "block";
            document.getElementById("locationContent").style.display = "none";
        }
    });
}

function updateLocationDetails(place) { 
    const components = place.address_components || [];
    locationData.street = 'N.A.';
    components.forEach(component => {
        if (component.types.includes("route")) locationData.street = component.long_name;
        if (component.types.includes("locality")) locationData.city = component.long_name;
        if (component.types.includes("administrative_area_level_1")) locationData.state = component.long_name;
        if (component.types.includes("country")) locationData.country = component.long_name;
    });

    if (place.geometry && place.geometry.location) {
        locationData.latitude = place.geometry.location.lat();
        locationData.longitude = place.geometry.location.lng();
    }
    
    locationData.fullAddress = place.formatted_address;
    document.getElementById("addressText").textContent = `Site Address: ${locationData.fullAddress}`;
    document.getElementById("fallbackMessage").style.display = "none";

    document.getElementById('street').textContent=`Street: ${locationData.street}`;
    document.getElementById('city').textContent=`City: ${locationData.city}`;
    document.getElementById('state').textContent=`State: ${locationData.state}`;
    document.getElementById('country').textContent=`Country: ${locationData.country}`;
    document.getElementById('latitude').textContent=`Latitude: ${locationData.latitude}`;
    document.getElementById('longitude').textContent=`Longitude: ${locationData.longitude}`;
}

function setupSaveLocationListener() {
    const saveLocationBtn = document.getElementById("creatbtn");
    if (!isEventListenerAdded) {
        saveLocationBtn.addEventListener('click', () => saveOrUpdateLocation('POST', '/locations'));
        isEventListenerAdded = true;
    }
}

function setupUpdateLocationListener() {
    const updateLocationBtn = document.getElementById("updatebtn");
    if (!isUpdateListener) {
        updateLocationBtn.addEventListener('click', () => {
            if (locationID !== null) saveOrUpdateLocation('PUT', `/locations/${locationID}`);
        });
        isUpdateListener = true;
    }
}

function saveOrUpdateLocation(method, url) {
    const data = { location: locationData };
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => handleLocationResponse(data))
    .catch(error => console.error('Error:', error));
}

function handleLocationResponse(data) {
    console.log('Location saved:', data);
    locationID = data.id;
    document.getElementById("creatbtn").style.display = "none";
    document.getElementById("updatebtn").style.display = "block";
    document.getElementById("modalBtn").textContent = "Update Building Location";
    fetchLocations();
    displayMapOnMainContent();
}

function displayMapOnMainContent() {
    const mainContentMap = document.getElementById("mapMain");
    if (locationData.latitude !== 'N.A.' && locationData.longitude !== 'N.A.') {
        const mainMap = new google.maps.Map(mainContentMap, {
            center: { lat: locationData.latitude, lng: locationData.longitude },
            zoom: 14
        });
        new google.maps.Marker({
            position: { lat: locationData.latitude, lng: locationData.longitude },
            map: mainMap,
            title: locationData.fullAddress
        });
        mainContentMap.style.display = "block";
        document.getElementById("locationContent").style.display = "block";
    } else {
        mainContentMap.style.display = "none";
    }
}
// Add the function to fetch locations dynamically
function fetchLocations() {
    fetch("/locations.json") // Adjust the URL according to your routes
        .then(response => response.json())
        .then(locations => updateLocationList(locations))
        .catch(error => console.error("Error fetching locations:", error));
}

// Function to update the location list in the DOM
function updateLocationList(locations) {
    const locationList = document.getElementById("location-list");
    locationList.innerHTML = ""; // Clear the existing list

    if (locations.length > 0) {
        locations.forEach(location => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "my-1");
            listItem.textContent = location.street !== "N.A." ? `${location.street}, ${location.city}` : location.city;
            locationList.appendChild(listItem);
        });
    } else {
        const noLocationItem = document.createElement("li");
        noLocationItem.classList.add("list-group-item", "text-muted");
        noLocationItem.style.border = "none";
        noLocationItem.textContent = "No Building Location Found";
        locationList.appendChild(noLocationItem);
    }
}
