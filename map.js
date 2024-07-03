document.addEventListener('DOMContentLoaded', (event) => {
    const map = L.map('map').setView([37.7749, -122.4194], 5); // Centered on the US initially

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            marker: false,
            polyline: false,
            circle: false,
            circlemarker: false,
            polygon: false,
            rectangle: true
        }
    });
    map.addControl(drawControl);

    let selectedBounds;

    map.on(L.Draw.Event.CREATED, (e) => {
        const type = e.layerType;
        const layer = e.layer;

        if (type === 'rectangle') {
            selectedBounds = layer.getBounds();
        }

        drawnItems.addLayer(layer);
    });

    document.getElementById('queryBtn').addEventListener('click', () => {
        if (!selectedBounds) {
            alert('Please select a region on the map first.');
            return;
        }

        const minLat = selectedBounds.getSouthWest().lat;
        const maxLat = selectedBounds.getNorthEast().lat;
        const minLon = selectedBounds.getSouthWest().lng;
        const maxLon = selectedBounds.getNorthEast().lng;

        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-06-01&endtime=2024-07-02&minmagnitude=5&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const events = data.features;
                const tbody = document.getElementById('data');
                tbody.innerHTML = '';

                events.forEach(event => {
                    const row = document.createElement('tr');

                    const timeCell = document.createElement('td');
                    const date = new Date(event.properties.time);
                    timeCell.textContent = date.toLocaleString();
                    row.appendChild(timeCell);

                    const latCell = document.createElement('td');
                    latCell.textContent = event.geometry.coordinates[1];
                    row.appendChild(latCell);

                    const lonCell = document.createElement('td');
                    lonCell.textContent = event.geometry.coordinates[0];
                    row.appendChild(lonCell);

                    const magCell = document.createElement('td');
                    magCell.textContent = event.properties.mag;
                    row.appendChild(magCell);

                    const depthCell = document.createElement('td');
                    depthCell.textContent = event.geometry.coordinates[2];
                    row.appendChild(depthCell);

                    const regionCell = document.createElement('td');
                    regionCell.textContent = event.properties.place;
                    row.appendChild(regionCell);

                    tbody.appendChild(row);
                });

                fetchCities500Data(minLat, maxLat, minLon, maxLon);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    function fetchCities500Data(minLat, maxLat, minLon, maxLon) {
        fetch('https://raw.githubusercontent.com/YourUsername/YourRepo/main/data/cities500.zip')
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const text = e.target.result;
                    parseGeonamesData(text, minLat, maxLat, minLon, maxLon);
                };
                reader.readAsText(blob);
            })
            .catch(error => {
                console.error('Error fetching cities data:', error);
            });
    }

    function parseGeonamesData(data, minLat, maxLat, minLon, maxLon) {
        const lines = data.split('\n');
        const cities = lines.map(line => {
            const parts = line.split('\t');
            return {
                name: parts[1],
                latitude: parseFloat(parts[4]),
                longitude: parseFloat(parts[5])
            };
        });

        // Filter cities within the selected bounds
        const filteredCities = cities.filter(city => {
            return city.latitude >= minLat && city.latitude <= maxLat &&
                   city.longitude >= minLon && city.longitude <= maxLon;
        });

        const tbody = document.getElementById('data');
        filteredCities.forEach(city => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = city.name;
            row.appendChild(nameCell);

            const latCell = document.createElement('td');
            latCell.textContent = city.latitude;
            row.appendChild(latCell);

            const lonCell = document.createElement('td');
            lonCell.textContent = city.longitude;
            row.appendChild(lonCell);

            tbody.appendChild(row);
        });
    }
});
