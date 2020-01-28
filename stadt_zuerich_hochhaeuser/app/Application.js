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

/*
* Title: Manhattan Skyscraper Explorer Main Application
* Author: Raluca Nicola
* Date: 07/06/17
* Description: Main application file where the UI and scene view are loaded
*/

define([
  "dojo/_base/declare",
  "esri/core/Accessor",


  "esri/Map",
 "esri/Basemap",
  "esri/views/SceneView",
  "esri/layers/ElevationLayer",
  "esri/layers/SceneLayer",
  "esri/layers/FeatureLayer",
  "esri/tasks/support/Query",
  "esri/renderers/SimpleRenderer",
  "esri/core/watchUtils",
  "esri/Ground",

  "app/RendererGenerator",
  "app/HeightGraph",
  "app/Timeline",
  "app/InfoWidget",
  "app/labels",
  "app/searchWidget",
  "app/categorySelection",

  "dojo/dom",
  "dojo/on",
  "dojo/query"
], function(declare, Accessor,
  Map, Basemap, SceneView, ElevationLayer, SceneLayer, FeatureLayer, SimpleRenderer, Query, watchUtils, Ground,
  RendererGenerator, HeightGraph, Timeline, InfoWidget, labels, searchWidget, categorySelection,
  dom, on, domQuery
) {
  return declare(null, {

    constructor: function(settings) {

      this.settings = settings;

      var State = Accessor.createSubclass({
        properties: {
          selectedPeriod: null,
          selectedBuilding: null,
          hoveredBuilding: null,
          filteredBuildings: null,
          selectedCategory: settings.initCategory
        }
      });

      // application state object - alerts on select, hover or period change
      this.state = new State();
    },

    /**
     * Initialize view, information widget, height graph and timeline.
     */

    init: function(containers) {

      var settings = this.settings;
      var state = this.state;

      var buildings,
        heightGraph, timeline,
        selectHighlight, hoverHighlight;
      

      // create map

      var basemap = new Basemap({
        portalItem: {
          id: "f9af6367a86b450b893f41c1ca357a39"
        }
      });

      var worldElevation = ElevationLayer({
        url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
      });
      var customElevation = ElevationLayer({
        url: "https://tiles.arcgis.com/tiles/ivZnKqrRPYFS9V9R/arcgis/rest/services/DTM_2014_KTZH_ProjectRaster/ImageServer"
      });
      
      var ground = new Ground({
        layers: [worldElevation]
      });

      var map = new Map({
       basemap: "topo",
        ground: ground
      });

      // create view
      var view = new SceneView({
        container: containers.view,
        map: map,
        padding: {
          top: 50
        },
        camera: {
          position: {
           x: 8.54891918,
            y: 47.3455014,
            z: 1061.2
          },
          heading: 343.5,
          tilt: 80
        },
        constraints: {
          tilt: {
            max: 90,
            mode: "manual"
          }
        },
        highlightOptions: settings.highlightOptions,
        popup: {
          dockEnabled: true,
          dockOptions: {
            buttonEnabled: false,
            breakpoint: false
          },
          actions: []
        },
        environment: {
          lighting: {
            ambientOcclusionEnabled: true,
            directShadowsEnabled: true,
      date: new Date("Tue Jun 21 2019 10:00:00 GMT+0100 (CET)")
          }
        }
      });



    // Create the event's callback functions
    /*on(dom.byId("timeOfDaySelect"), "change", function(ev) {
      var select = ev.target;
      var date = select.options[select.selectedIndex].value;
      view.environment.lighting.date = new Date(date);
    });
    
    on(dom.byId("directShadowsInput"), "change", function updateDirectShadows(ev) {
      view.environment.lighting.directShadowsEnabled = !!ev.target.checked;
    });*/


    
      /*watchUtils.whenFalse(view, "updating", function (evt) {
        dom.byId("loading").style.display = "none";
      });*/
      
    // remove navigation widgets from upper left corner
    view.ui.move(["zoom", "compass"], "bottom-right");
    view.ui.empty("top-left");

      // set view on the window for debugging
      window.view = view;

      // we set an initial filter to display only buildings whose height is between minHeight and maxHeight
      var filter = [settings.buildingOptions.minHeight, settings.buildingOptions.maxHeight, settings.buildingOptions.minCnstrctYear, settings.buildingOptions.maxCnstrctYear];
      var definitionExpression = generateDefinitionExpression(filter);

      
      // scene layer with the buildings
      var sceneLayer = new SceneLayer({
        url: settings.buildingsUrl,
        popupEnabled: false,
        outFields: ["*"],
        //definitionExpression: definitionExpression

    });

      var rendererGen = new RendererGenerator(settings, sceneLayer, "CNSTRCT_YR", state);

      // feature layer with centroids of buildings - displayed on top of buildings to show which buildings contain information from wikipedia
      var infoPoints = new FeatureLayer({
        url: settings.infoPointsUrl,
        popupEnabled: false,
        // relative to scene displays icons on top of buildings
        elevationInfo: {
          mode: "relative-to-scene"
        },
        outFields: ["*"],
        returnZ: false,
        // avoid decluttering by using featureReduction
        featureReduction: {
          type: "selection"
        },
        //renderer: rendererGen.createUniqueValueRenderer("WIKI", {value: 1, image: "./img/wiki.png"}),
        //visible: false,
    definitionExpression: "(GEBAEUDETYP = 'Hochhaus PBG' OR GEBAEUDETYP = 'Hochhaus Studie') AND CNSTRCT_YR >= " + settings.buildingOptions.minCnstrctYear + " AND CNSTRCT_YR <= " + settings.buildingOptions.maxCnstrctYear
      });
    
    // BZO Hochhausgebiete
    var HHGebiete = new FeatureLayer({
     url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/BZO_Hochhausgebiet_neu/FeatureServer",
     opacity: 0.85,
     visible: false
    });

    // BZO-Nutzungsplan
    /*var BZO_Zonen = new FeatureLayer({
      url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/Zonenplan_BZO/FeatureServer",
      opacity: 0.85,
      visible: false
     });

    // Praegende Achsen
    var Achsen = new FeatureLayer({
      url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/Strassenachsen/FeatureServer",
      opacity: 0.85,
      visible: false
     });

    // Zentren
    var Zentren = new FeatureLayer({
      url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/Zentren_merge/FeatureServer",
      opacity: 0.85,
      visible: false
     });

    // Dichtegebiete
    var Dichtegebiete = new FeatureLayer({
      url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/Dichtegebiete/FeatureServer",
      opacity: 0.85,
      visible: false
     });

         // Verdichtungsgebiete
    var Verdichtung = new FeatureLayer({
      url: "https://services1.arcgis.com/ivZnKqrRPYFS9V9R/arcgis/rest/services/Verdichtungsgebiete/FeatureServer",
      opacity: 0.85,
      visible: false
     });*/
    
      map.addMany([sceneLayer, /*BZO_Zonen, */HHGebiete, /*Verdichtung, Dichtegebiete, Zentren, Achsen*/]);
    
    var HHGebieteToggle = dom.byId("HHGebieteLayer");
    //var BZO_ZonenToggle = dom.byId("BZO_ZonenLayer");
    //var AchsenToggle = dom.byId("AchsenLayer");
    //var ZentrenToggle = dom.byId("ZentrenLayer");
    //var DichteToggle = dom.byId("DichteLayer");
    //var VerdichtungToggle = dom.byId("VerdichtungLayer");
    
    // Listen to the onchange event for the checkbox
    on(HHGebieteToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
    HHGebiete.visible = HHGebieteToggle.checked;
    });

    /*// Listen to the onchange event for the checkbox
    on(BZO_ZonenToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
      BZO_Zonen.visible = BZO_ZonenToggle.checked;
    });


    // Listen to the onchange event for the checkbox
    on(AchsenToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
    Achsen.visible = AchsenToggle.checked;
    });

    // Listen to the onchange event for the checkbox
    on(ZentrenToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
      Zentren.visible = ZentrenToggle.checked;
    });

    // Listen to the onchange event for the checkbox
    on(DichteToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
    Dichtegebiete.visible = DichteToggle.checked;
    });

    // Listen to the onchange event for the checkbox
    on(VerdichtungToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
    Verdichtung.visible = VerdichtungToggle.checked;
    });*/    

      // initialize info widget
      var infoWidget = new InfoWidget(view, state);

      // initialize search widget
      // searchWidget.initialize(view, infoPoints, "name", state);

      // create a query on the infoPoints layer to get all the buildings that will be displayed in the height graph
      var query = infoPoints.createQuery();
      query.outFields = ["OBJECTID", "NAME", "HEIGHTROOF", "CNSTRCT_YR", "TOP20", "GEBAEUDETYP", "WOHNHOCHHAUS", "EGID"];
      query.returnGeometry = true;
      infoPoints.queryFeatures(query)
        .then(initGraphics)
        .otherwise(error);

      // initGraphics method takes the results of the query and stores them in the buildings array
      function initGraphics(results) {
        // turning all upper case fields to lower case to be able to use properties in lower case
        for (var i = 0; i < results.features.length; i++) {
          toLowerCase(results.features[i]);
        }
        buildings = results.features;
        categorySelection.initialize(containers.categories, settings, state);
        heightGraph = new HeightGraph(containers.heightGraph, settings, buildings, state);
        timeline = new Timeline(containers.timeline, settings, state);
        state.selectedPeriod = settings.initPeriod;
      }

      state.watch("selectedPeriod", function(newPeriod) {
        var newCategory = state.selectedCategory;
        // update building symbology
          rendererGen.applyClassBreaksRenderer(newPeriod);
        // update height graph
        heightGraph.updatePeriod(newPeriod, newCategory);
        // update timeline
        timeline.update(newPeriod);

      });

      view.whenLayerView(sceneLayer)
        .then(function(lv) {
          state.watch("hoveredBuilding", function(newFeature) {
            if (newFeature !== null) {
              // highlight on hover in the height graph
              heightGraph.hover(newFeature);
              // highlight newFeature on the map
              hoverHighlight = lv.highlight([newFeature.attributes.objectid]);
            }
            else {
              // remove highlight in height graph and on the map
              heightGraph.removeHover();
              if (hoverHighlight) {
                hoverHighlight.remove();
              }
            }
          });

          state.watch("selectedBuilding", function(feature) {

            if (feature !== null) {
              // remove highlight for selection in height graph and on the map
              heightGraph.deselect();
              if (selectHighlight) {
                selectHighlight.remove();
              }

              // highlight on hover in the height graph
              heightGraph.select(feature);

              // highlight feature on the map
              selectHighlight = lv.highlight([feature.attributes.objectid]);

              // zoom to the building in the map
              view.goTo({ target: feature.geometry }, { duration: 1000, easing: "out-expo" });

              // hide the search widget to show the popup
              // domQuery(".esri-component.esri-search.esri-widget")[0].style.display = "none";
              // display information about the building in the popup
              infoWidget.setContent(feature.geometry, feature.attributes);

              // frame the 3D building
              var query = new Query();
              query.outFields = ["*"];
              query.objectIds = [feature.attributes.objectid];
              var result = {
                extent: null,
                firstTry: true
              };
              // the queryChain function will be run until the queryExtent function returns the 3D extent of the building
              function queryChain(result) {
                if (result.extent !== null) {
                  dom.byId("loading").style.display = "none";
                  view.goTo({ target: result.extent.expand(3), tilt: 60 }, { duration: 1000, easing: "out-expo" });
                }
                else {
                  if (!result.firstTry) {
                    dom.byId("loading").style.display = "inline";
                  }
                  lv.queryExtent(query).then(function(result) {
                    window.setTimeout(function() {
                      queryChain(result);
                    }, 1000);
                  });
                }
              }
              queryChain(result);
            }
            else {
              // remove highlights and display the search widget
              heightGraph.deselect();
              if (selectHighlight) {
                selectHighlight.remove();
              }
              //domQuery(".esri-component.esri-search.esri-widget")[0].style.display = "inline";
            }
          });
        })
        .otherwise(error);
      
      state.watch("filteredBuildings", function(newFilter) {
        // generate a new definition expression based an the new filter
        var defExp = generateDefinitionExpression(newFilter);
        // set the definitionExpression on the buildings and points layers
        sceneLayer.definitionExpression = defExp;
        infoPoints.definitionExpression = defExp;
        // update the height graph based on the new min and max building heights
        heightGraph.updateFilter(newFilter);
      });

      // categories help users visualize the most important buildings
      state.watch("selectedCategory", function(newCategory) {
        var newPeriod = state.selectedPeriod;
        rendererGen.applyCategory(newCategory, newPeriod);
        heightGraph.applyCategory(newCategory, newPeriod);
      });

      // when user clicks on a building, set it as the selected building in the state
      view.on("click", function(event) {
        view.hitTest(event.screenPoint).then(function(response) {
          var graphic = response.results[0].graphic;
          if (graphic && (graphic.layer.title === sceneLayer.title)) {
            var feature = findFeature(graphic);
            if (feature) {
              if (state.selectedBuilding == null) {
                state.selectedBuilding = feature;
              }
              else {
                if (state.selectedBuilding.attributes.objectid !== feature.attributes.objectid) {
                  state.selectedBuilding = feature;
                }
              }
            }
          }
        });
      });

      // when user hovers on a building set it in the state in the hovered
      var lastHover = Date.now();
      view.on("pointer-move", function(evt) {
        var newHover = Date.now();
        if ((newHover - lastHover) > 20 && !view.interacting) {
          lastHover = newHover;
          view.hitTest({ x: evt.x, y: evt.y }).then(function(response) {
            var graphic = response.results[0] ? response.results[0].graphic : null;
            if (graphic && (graphic.layer.title === sceneLayer.title)) {
              var feature = findFeature(graphic);
              var building = state.hoveredBuilding;
              if (feature) {
                if ((!building) || (feature.attributes.objectid !== building.attributes.objectid)) {
                  heightGraph.removeHover();
                  if (hoverHighlight) {
                    hoverHighlight.remove();
                  }
                  state.hoveredBuilding = feature;
                }
              }
              else {
                state.hoveredBuilding = null;
              }
            }
            else {
              state.hoveredBuilding = null;
            }
          });
        }
      });

      function findFeature(graphic) {
        var feature = buildings.filter(function(b) {
          return (b.attributes.objectid === graphic.attributes.OBJECTID);
        })[0];
        return feature;
      }

      // remove hovered building when mouse is outside of map
      on(dom.byId("menuDiv"), "mouseenter", function() {
        state.hoveredBuilding = null;
      });
      on(domQuery(".esri-popup__main-container"), "mouseenter", function() {
        state.hoveredBuilding = null;
      });
    
    // add events for rechtliche Hinweise
      on(dom.byId("RechtLink"), "click", function() {
        dom.byId("RechtContainer").style.display = "inline";
        dom.byId("NutzungContainer").style.display = "none";
        dom.byId("ImprContainer").style.display = "none";
      });
      on(dom.byId("close1"), "click", function() {
        dom.byId("RechtContainer").style.display = "none";
      });
    
    // add events for Impressum window
      on(dom.byId("ImprLink"), "click", function() {
        dom.byId("ImprContainer").style.display = "inline";
        dom.byId("NutzungContainer").style.display = "none";
        dom.byId("RechtContainer").style.display = "none";
      });
      on(dom.byId("close2"), "click", function() {
        dom.byId("ImprContainer").style.display = "none";
      });
    
    // add events for Nutzungshinweise
      on(dom.byId("NutzungLink"), "click", function() {
        dom.byId("NutzungContainer").style.display = "inline";
        dom.byId("ImprContainer").style.display = "none";
        dom.byId("RechtContainer").style.display = "none";
      });
      on(dom.byId("close3"), "click", function() {
        dom.byId("NutzungContainer").style.display = "none";
      });

    // add events for Legende
    on(dom.byId("info1"), "click", function() {
      dom.byId("info_container_HH").style.display = "inline";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
    });
    /*on(dom.byId("info2"), "click", function() {
      dom.byId("info_container_BZO").style.display = "inline";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
    });
    on(dom.byId("info3"), "click", function() {
      dom.byId("info_container_Strassen").style.display = "inline";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
    });
    on(dom.byId("info4"), "click", function() {
      dom.byId("info_container_Zentren").style.display = "inline";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
    });
    on(dom.byId("info5"), "click", function() {
      dom.byId("info_container_Dichte").style.display = "inline";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
    });
    on(dom.byId("info6"), "click", function() {
      dom.byId("info_container_Verdichtung").style.display = "inline";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
    });*/

    on(dom.byId("close4"), "click", function() {
      dom.byId("info_container_HH").style.display = "none";
    });
    on(dom.byId("close5"), "click", function() {
      dom.byId("info_container_BZO").style.display = "none";
    });
    on(dom.byId("close6"), "click", function() {
      dom.byId("info_container_Strassen").style.display = "none";
    });
    on(dom.byId("close7"), "click", function() {
      dom.byId("info_container_Zentren").style.display = "none";
    });
    on(dom.byId("close8"), "click", function() {
      dom.byId("info_container_Dichte").style.display = "none";
    });
    on(dom.byId("close9"), "click", function() {
      dom.byId("info_container_Verdichtung").style.display = "none";
    });

    // add events for Tageslicht
    /*on(dom.byId("Tageslicht"), "click", function() {
      dom.byId("layerToggle").style.display = "none";
      dom.byId("info_container_Verdichtung").style.display = "none";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("environmentDiv").style.display = "inline";
      dom.byId("bg-blue").style.height = "120px";
      dom.byId("symbole").style.display = "none";
    });*/

    /*on(dom.byId("close10"), "click", function() {
      dom.byId("environmentDiv").style.display = "none";
      dom.byId("bg-blue").style.height = "100px";
      dom.byId("symbole").style.display = "inline";
    });*/

    // add events for LayerContainer
    /*on(dom.byId("Layer"), "click", function() {
      dom.byId("layerToggle").style.display = "inline";
      dom.byId("bg-blue").style.height = "300px";
      dom.byId("environmentDiv").style.display = "none";
      dom.byId("symbole").style.display = "none";
    });*/

    /*on(dom.byId("close11"), "click", function() {
      dom.byId("layerToggle").style.display = "none";
      dom.byId("bg-blue").style.height = "100px";
      dom.byId("info_container_Verdichtung").style.display = "none";
      dom.byId("info_container_HH").style.display = "none";
      dom.byId("info_container_BZO").style.display = "none";
      dom.byId("info_container_Strassen").style.display = "none";
      dom.byId("info_container_Dichte").style.display = "none";
      dom.byId("info_container_Zentren").style.display = "none";
      dom.byId("symbole").style.display = "inline";
    });*/
  }
});

    



  function generateDefinitionExpression(filter) {
    var minConstructionYear = 0
    var maxConstructionYear = 5000
    
    if (filter[2] !== undefined) {
      minConstructionYear = filter[2]
    }
    if (filter[3] !== undefined) {
      maxConstructionYear = filter[3]
    }
    
    return "HEIGHTROOF > " + filter[0] + " AND " +
      "HEIGHTROOF < " + filter[1] + " AND " +
      "CNSTRCT_YR >= " + minConstructionYear + " AND CNSTRCT_YR <= " + maxConstructionYear;
  }

  function error(err) {
    console.log(err);
  }

  // convert all property names of an object to lower case
  function toLowerCase(feature) {
    var key, keys = Object.keys(feature.attributes);
    var n = keys.length;
    var newobj = {};
    while (n--) {
      key = keys[n];
      newobj[key.toLowerCase()] = feature.attributes[key];
    }
    feature.attributes = newobj;
  }

});
