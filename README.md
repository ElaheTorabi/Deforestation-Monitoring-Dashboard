# Chad Forest Monitoring Portal

An interactive web prototype of a forest monitoring dashboard for Chad's Ministry of Environment. It shows how field staff and analysts could report, map and track incidents such as illegal logging, bushfires and land encroachment.

**Live demo:** https://elahetorabi.github.io/Deforestation-Monitoring-Dashboard/

> **Note:** This is a prototype built with sample data. No real sign-in is needed: any email address works, or use the "Continue as demo user" button. Nothing you type is stored or sent anywhere.

## Features

- **Interactive map:** incidents are shown as markers on a real map of southern Chad, colour-coded by status (new, under review, resolved). Click a marker to see its type, region, concession status and report date.
- **Street and satellite views:** switch between basemaps with the layers button.
- **Filters:** narrow incidents by region, concession type (legal or illegal), event type and report status. The map, legend, statistics and report preview all update to match.
- **Case statistics:** a pie chart and totals summarising the incidents currently shown.
- **Report preview:** a summary of the filtered data with breakdowns by status, region and incident type.
- **Incident submission form:** a quick form for reporting new incidents without opening the full dashboard.
- **User guide:** an optional walkthrough of the dashboard's main features for first-time users.

## How to use

1. Open the live demo link above.
2. Choose **Monitoring and Analysis Dashboard**, then sign in with any email or click **Continue as demo user**.
3. Take the user guide or skip straight to the dashboard.
4. Use the filters on the left and click markers on the map to explore the incidents.

To run it locally, download the repository (keeping the `css` and `js` folders next to `index.html`) and open `index.html` in a browser with an internet connection.

## Built with

- HTML, CSS and JavaScript (no build step)
- [Leaflet](https://leafletjs.com/) for the interactive map
- [Chart.js](https://www.chartjs.org/) for the statistics chart
- Esri World Street Map and World Imagery basemaps

## Project structure

```
index.html      Page layout and content
css/style.css   Styles
js/app.js       Sample data, map, filters, statistics and reports
```

## Limitations

This prototype demonstrates the interface and workflow, not a working system:

- Incident data is generated sample data, not real observations.
- Sign-in, report submission, downloads and report generation are simulated.
- There is no database or backend.

A production version would connect to a real incident database, user accounts and field data collection.
