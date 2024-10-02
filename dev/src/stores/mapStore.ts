import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { cities, CityName, LayerName } from "@/assets/ts/constants";
import type { VectorLayer } from "@/assets/ts/types";
import type { GeoJSONData } from "@/assets/ts/types";

const useMapStore = defineStore("city", () => {
  // State
  const map = ref();
  const city = ref(cities[0].name);
  const geojsonData = ref<GeoJSONData>({});
  const isJsonDataLoad = ref<boolean>(false);
  const dataCache = ref<Record<string, GeoJSONData>>({});
  const vectorLayers: Record<string, VectorLayer> = {
    boundaryLayer: {
      name: LayerName.BOUNDARY,
      visible: ref(true),
      color: "black",
    },
    shelterLayer: { name: LayerName.SHELTER, visible: ref(true), color: "orange" },
    isochroneLayer: {
      name: LayerName.ISOCHRONE,
      visible: ref(true),
      range: [1, 2, 3, 4, 5],
    },
    populationLayer: {
      name: LayerName.POPULATION,
      visible: ref(false),
      range: [45, 35, 25, 15, 5],
    },
    healthSiteLayer: {
      name: LayerName.HEALTHSITEPOINT,
      visible: ref(false),
      color: "#EE6666",
    },
  };
  // Actions
  const fetchGeoData = async (cityName: CityName) => {
    // Check if data for the city is cached
    if (dataCache.value[cityName]) {
      geojsonData.value = dataCache.value[cityName];
      isJsonDataLoad.value = true;
      return;
    }

    try {
      // Create an array of promises for API requests
      const [shelterRes, boundaryRes, isochroneRes, populationRes, healthSitePointRes] =
        await Promise.all([
          axios.get(`/api/shelter/${cityName}`),
          axios.get(`/api/boundary/${cityName}`),
          axios.get(`/api/isochrone/${cityName}`),
          axios.get(`/api/population/${cityName}`),
          axios.get(`/api/health-site-point/${cityName}`),
        ]);
      // Assign data to geojsonData
      geojsonData.value = {
        shelters: shelterRes.data,
        boundary: boundaryRes.data,
        isochrones: isochroneRes.data,
        population: populationRes.data,
        healthSitePoint: healthSitePointRes.data,
      };
      // Sort isochrones by range
      geojsonData.value.isochrones?.features.sort(
        (a, b) => b.properties.range - a.properties.range,
      );
      // Cache the fetched data
      dataCache.value[cityName] = geojsonData.value;
      // Set loading state to true after all data is loaded
      isJsonDataLoad.value = true;
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  // Actions to change city and refetch data
  const setCity = (newCity: CityName) => {
    city.value = newCity;
    fetchGeoData(newCity);
  };

  return {
    map,
    city,
    geojsonData,
    vectorLayers,
    isJsonDataLoad,
    setCity,
    fetchGeoData,
  };
});
export default useMapStore;
