//Global variables
var map;
var clientID;
var clientSecret;
var infoWindow;

//Initial map settings
function initMap() {
 'use strict';
 map = new google.maps.Map(document.getElementById('map'), {
  zoom: 14,
  center: {
   lat: 38.245012,
   lng: -122.039797
  }
 });
}

//Get the valid Phone number, referenced from snipplr
function formatPhone(phonenum) {
 'use strict';
 var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
 if (regexObj.test(phonenum)) {
  var parts = phonenum.match(regexObj);
  var phone = "";
  if (parts[1]) {
   phone += "+1 (" + parts[1] + ") ";
  }
  phone += parts[2] + "-" + parts[3];
  return phone;
 } else {
  //invalid phone number
  return phonenum;
 }
}

var initLocations = [{
 name: 'Walmart Supercenter',
 lat: 38.242637,
 lng: -121.990093
}, {
 name: 'Athenian Grill',
 lat: 38.237939,
 lng: -122.039103
}, {
 name: 'Anheuser-Busch',
 lat: 38.236436,
 lng: -122.093747
}, {
 name: 'In-N-Out Burger',
 lat: 38.257266,
 lng: -122.064702
}, {
 name: 'Solano Town Center',
 lat: 38.260232,
 lng: -122.053493
}];


//Location function for storing info from initLocations
var Location = function(data) {
 'use strict';
 var self = this;
 this.name = data.name;
 this.lat = data.lat;
 this.lng = data.lng;
 this.URL = "";
 this.street = "";
 this.city = "";
 this.phone = "";
 this.visible = ko.observable(true);

 //initializing the foursquare api and what info will be displayed
 //info window and markers will also be created in this function for each location
 //this portion is a necessity for the foursquare api to work, format and all
 var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.lat + ',' + this.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

 $.getJSON(foursquareURL).done(function(data) {
  var results = data.response.venues[0];
  self.URL = results.url;
  if (typeof self.URL === 'undefined') {
   self.URL = "";
  }
  self.street = results.location.formattedAddress[0];
  self.city = results.location.formattedAddress[1];
  self.phone = results.contact.phone;
  if (typeof self.phone === 'undefined') {
   self.phone = "";
  } else {
   self.phone = formatPhone(self.phone);
  }
 }).fail(function() {
  alert("Foursquare API has a bug. Refresh the page and try again.");
 });

 this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
  '<div class="content"><a href="' + self.URL + '">' + self.URL + "</a></div>" +
  '<div class="content">' + self.street + "</div>" +
  '<div class="content">' + self.city + "</div>" +
  '<div class="content">' + self.phone + "</div></div>";

 this.infoWindow = new google.maps.InfoWindow({
  content: self.contentString
 });

 this.marker = new google.maps.Marker({
  position: new google.maps.LatLng(data.lat, data.lng),
  map: map,
  title: data.name
 });

 this.showMarker = ko.computed(function() {
  if (this.visible() === true) {
   this.marker.setMap(map);
  } else {
   this.marker.setMap(null);
  }
  return true;
 }, this);

 this.marker.addListener('click', function() {
  self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
   '<div class="content"><a href="' + self.URL + '">' + self.URL + "</a></div>" +
   '<div class="content">' + self.street + "</div>" +
   '<div class="content">' + self.city + "</div>" +
   '<div class="content"><a href="tel:' + self.phone + '">' + self.phone + "</a></div></div>";

  self.infoWindow.setContent(self.contentString);

  self.infoWindow.open(map, this);
 });

 this.bounce = function(place) {
  google.maps.event.trigger(self.marker, 'click');
 };
};

//creating the view model for the map and filtering the search options
function AppViewModel() {
 'use strict';
 var self = this;
 this.searchTerm = ko.observable("");
 this.locationList = ko.observableArray([]);
 initMap();

 clientID = "GD5HO1JNOPQOFUUYFOZ3TY1JVPET00S1FKXR1AEHOMGWNL01";
 clientSecret = "AGIEIERXMQPHX03CZIAGWQQJJWE1E4XIXUFI3VSSIIICMXTI";

 initLocations.forEach(function(locationItem) {
  self.locationList.push(new Location(locationItem));
 });

 this.filteredList = ko.computed(function() {
  var filter = self.searchTerm().toLowerCase();
  if (!filter) {
   self.locationList().forEach(function(locationItem) {
    locationItem.visible(true);
   });
   return self.locationList();
  } else {
   return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
    var string = locationItem.name.toLowerCase();
    var result = (string.search(filter) >= 0);
    locationItem.visible(result);
    return result;
   });
  }
 }, self);

 this.mapElem = document.getElementById('map');
}

//app binding and error handling
function startApp() {
 'use strict';
 ko.applyBindings(new AppViewModel());
}

function errorHandling() {
 'use strict';
 alert("Google Maps failed to load. Check your internet connection and try refreshing the page.");
}