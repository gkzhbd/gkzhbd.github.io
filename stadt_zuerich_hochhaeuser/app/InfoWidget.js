/* Copyright 2017 Esri

   Licensed under the Apache License, Version 2.0 (the "License");

   you may not use this file except in compliance with the License.

   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software

   distributed under the License is distributed on an "AS IS" BASIS,

   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

   See the License for the specific language governing permissions and

   limitations under the License.*/

/************************************************************************
 * This class creates a popup and fills it with information about buildings.
 * Wikipedia API is used to retrieve an abstract of the building. All retrieved
 * articles are under the Creative Commons Attribution-ShareAlike License.
 * See https://wikimediafoundation.org/wiki/Terms_of_Use for details.
 * Flickr API is used to retrieve images of the buildings under Creative Commons license.
 * See https://www.flickr.com/services/api/tos/ for licensing information.
 * For the image gallery Galleria.io is used: https://galleria.io/.
 ************************************************************************/

define([
  "dojo/_base/declare",
  "esri/request",
  "esri/config"
], function(declare, esriRequest, esriConfig) {

  return declare(null, {

    constructor: function(view, state) {

      this.view = view;

      view.popup.watch("visible", function(newValue) {
        if (!newValue) {
          state.selectedBuilding = null;
        }
      });

      esriConfig.request.corsEnabledServers.push("https://de.wikipedia.org/", "https://api.flickr.com/");
    },

    setContent: function(position, attributes) {

      var view = this.view;

      // set the building name, height and construction year from the building attributes
      var name = (attributes.name === "" || attributes.name === null || attributes.name === "baulicher Akzent") ? "Hochhaus" : attributes.name;
      view.popup.content = "<h3>" + name  + "</h3>"
      + "<p class='info'> <img src='./img/height.png'> " + Math.round(attributes.heightroof) + " Meter"
      + "<img src='./img/construction.png'> " + attributes.cnstrct_yr + "</p>"

      view.popup.open();
    }
  });
});
