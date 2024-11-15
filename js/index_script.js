let countryNames = []; // Armazena os nomes dos países

var width = window.innerWidth / 2, height = window.innerHeight * 0.85;
var projection = d3.geoMercator()
  .scale(window.innerWidth / 13)
  .translate([width / 2, height / 1.7]);

var path = d3.geoPath().projection(projection);
var sportColorScale = d3.scaleQuantize().domain([0, 50]).range(d3.schemeBlues[9]);
var obesityColorScale = d3.scaleQuantize().domain([0, 50]).range(d3.schemeYlOrBr[9]);

var selectedFilters = { ageGroup: "children", gender: "male" };
var selectedCountryCodes = new Set(); // Armazena os códigos dos países selecionados

let dataByCountry = {}; // Coloca o dataByCountry em um escopo acessível

Promise.all([
  d3.json("https://d3js.org/world-110m.v1.json"),
  d3.csv("dataset/dataset.csv")
]).then(function ([worldData, csvData]) {
  var countries = topojson.feature(worldData, worldData.objects.countries).features;

  csvData.forEach(function (d) {
    if (d['ISO Code']) {
      if (!dataByCountry[d['ISO Code']]) {
        dataByCountry[d['ISO Code']] = { children: {}, adult: {} };
      }

      const football = parseFloat(d['Football (%)']) || 0;
      const basketball = parseFloat(d['Basketball (%)']) || 0;
      const running = parseFloat(d['Running (%)']) || 0;
      const averageSportsParticipation = ((football + basketball + running) / 3).toFixed(2);

      dataByCountry[d['ISO Code']][d.Group.toLowerCase()][d.Gender.toLowerCase()] = {
        ...d,
        "Sports Participation (%)": averageSportsParticipation
      };
    }
  });

  function drawMap(containerId, dataType, title, colorScale) {
    d3.select(containerId).selectAll("svg").remove();
    var svg = d3.select(containerId).append("svg").attr("width", width).attr("height", height);

    svg.selectAll("path")
      .data(countries.filter(d => d.id !== "010")) // Exclui a Antártida
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", function (d) {
        var countryCode = d.id;
        var countryData = dataByCountry[countryCode];

        if (selectedCountryCodes.has(countryCode)) {
          return "#FF0000";
        }

        if (countryData) {
          var selectedData = countryData[selectedFilters.ageGroup][selectedFilters.gender];
          if (selectedData) {
            var value = dataType === "sports"
              ? parseFloat(selectedData['Sports Participation (%)'])
              : parseFloat(selectedData['Obesity Rate (%)']);
            return colorScale(value);
          }
        }
        return "#ccc";
      })
      .on("mouseover", function (event, d) {
        var countryCode = d.id;
        var countryData = dataByCountry[countryCode];

        if (countryData) {
          var selectedData = countryData[selectedFilters.ageGroup][selectedFilters.gender];
          if (selectedData) {
            var popup = d3.select("#popup");
            var content = `<h3>${selectedData.Country}</h3>`;

            if (dataType === "sports") {
              var sportsParticipation = selectedData['Sports Participation (%)'] || 'N/A';
              content += `<p>Sports Participation: ${sportsParticipation}%</p>`;
            } else {
              var obesityRate = selectedData['Obesity Rate (%)'] || 'N/A';
              content += `<p>Obesity Rate: ${obesityRate}%</p>`;
            }

            popup.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 50) + "px")
              .style("display", "block")
              .html(content);
          }
        }
      })
      .on("mouseleave", function () {
        d3.select("#popup").style("display", "none");
      })
      .on("click", function (event, d) {
        var countryCode = d.id;
        if (selectedCountryCodes.has(countryCode)) {
          selectedCountryCodes.delete(countryCode);
          selectCountry(dataByCountry[countryCode])
        } else {
          selectedCountryCodes.add(countryCode);
          selectCountry(dataByCountry[countryCode])
        }
        drawMaps();
      });

    var zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", function (event) {
        svg.selectAll("path").attr("transform", event.transform);
      });

    svg.call(zoom);
  }

  function drawMaps() {
    drawMap("#map1", "sports", "Global Sports Participation Rate", sportColorScale);
    drawMap("#map2", "obesity", "Global Obesity Rate", obesityColorScale);
  }

  drawMaps();

  function updateFilters() {
    selectedFilters.ageGroup = document.querySelector("input[name='ageGroup']:checked").value;
    selectedFilters.gender = document.querySelector("input[name='gender']:checked").value;
    drawMaps();
  }

  document.getElementById("generateBtn").addEventListener("click", updateFilters);

}).catch(function (error) {
  console.error("Error loading data: ", error);
});

function selectCountry(countryObj) {
  let country_value = null;
  for (const ageGroup in countryObj) {
    const genderData = countryObj[ageGroup];
    for (const gender in genderData) {
      const countryData = genderData[gender];
      if (!countryNames.includes(countryData.Country)) {
        countryNames.push(countryData.Country);
        country_value = countryData.Country;
      } else {
        country_value = countryData.Country;
      }
    }
  }
  let selectedCountries = JSON.parse(localStorage.getItem("selectedCountries")) || [];
  if (country_value !== null) {
    if (selectedCountries.includes(country_value)) {
      selectedCountries = selectedCountries.filter(c => c !== country_value);
    } else {
      selectedCountries.push(country_value);
    }
  }
  localStorage.setItem("selectedCountries", JSON.stringify(selectedCountries));
}

window.onload = function () {
  localStorage.removeItem("selectedCountries");
};


document.addEventListener("DOMContentLoaded", function () {
  // Adiciona o evento para abrir o modal quando clicar em "View Top 10"
  document.getElementById("viewTop10Btn").addEventListener("click", showTop10Modal);

  // Adiciona o evento para fechar o modal quando clicar em "Close"
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);

  function showTop10Modal() {
      updateTop10Lists(dataByCountry);
      document.getElementById("top10Modal").style.display = "block";
  }

  function closeModal() {
      document.getElementById("top10Modal").style.display = "none";
  }

  function updateTop10Lists(dataByCountry) {
      const ageGroup = selectedFilters.ageGroup;
      const gender = selectedFilters.gender;

      const top10 = Object.values(dataByCountry)
          .map(countryData => {
              const data = countryData[ageGroup][gender];
              return {
                  country: data.Country,
                  sportsParticipation: parseFloat(data['Sports Participation (%)'] || 0),
                  obesityRate: parseFloat(data['Obesity Rate (%)'] || 0)
              };
          })
          .sort((a, b) => b.sportsParticipation - a.sportsParticipation)
          .slice(0, 10);

      renderScatterPlot(top10, "#sportsChart");
  }

  function renderScatterPlot(data, containerId) {
    d3.select(containerId).selectAll("*").remove();

    const margin = { top: 30, right: 20, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.sportsParticipation) + 5])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.obesityRate) + 5])
        .range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.sportsParticipation))
        .attr("cy", d => y(d.obesityRate))
        .attr("r", 5)
        .style("fill", "#69b3a2");

    svg.selectAll("text.label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.sportsParticipation) -6) // Deslocamento horizontal
      .attr("y", d => y(d.obesityRate) - 1) // Deslocamento vertical
      .text(d => d.country)
      .style("font-size", "9px")
      .style("font-weight");
    

    // Adicionando título
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Top 10 Countries: Sports Participation vs Obesity Rate");

    // Adicionando rótulo do eixo X
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Sports Participation (%)");

    // Adicionando rótulo do eixo Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Obesity Rate (%)");
}

});
