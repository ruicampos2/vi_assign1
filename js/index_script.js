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
    // Seleciona o contêiner dos mapas
    const mapContainer = document.querySelector(".maps-container");
  
    // Adiciona o evento para abrir o modal quando clicar em "View Top 10"
    document.getElementById("viewTop10Btn").addEventListener("click", showTop10Modal);
  
    // Adiciona o evento para fechar o modal quando clicar em "Close"
    document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  
    function showTop10Modal() {
      // Atualiza os gráficos no modal
      updateTop10Lists(dataByCountry);
  
      // Exibe o modal
      document.getElementById("top10Modal").style.display = "block";
  
      // Torna os mapas opacos
      mapContainer.style.opacity = "0.3";
    }
  
    function closeModal() {
      // Esconde o modal
      document.getElementById("top10Modal").style.display = "none";
  
      // Restaura a opacidade dos mapas
      mapContainer.style.opacity = "1";
    }
  
    function renderBarChart(data, containerId, yLabel) {
      d3.select(containerId).selectAll("*").remove();
  
      const margin = { top: 20, right: 30, bottom: 40, left: 90 };
      const width = 500 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
  
      const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Define a escala do eixo X
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([0, width]);
  
      const y = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, height])
        .padding(0.1);
  
      svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2");
  
      svg.append("g").call(d3.axisLeft(y));
      svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .text(yLabel);
    }
  
    function updateTop10Lists(dataByCountry) {
      const ageGroup = selectedFilters.ageGroup;
      const gender = selectedFilters.gender;
  
      const sportsTop10 = Object.values(dataByCountry)
        .map(countryData => {
          const data = countryData[ageGroup][gender];
          return {
            country: data.Country,
            value: parseFloat(data['Sports Participation (%)'] || 0)
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  
      const obesityTop10 = Object.values(dataByCountry)
        .map(countryData => {
          const data = countryData[ageGroup][gender];
          return {
            country: data.Country,
            value: parseFloat(data['Obesity Rate (%)'] || 0)
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  
      renderBarChart(sportsTop10, "#sportsChart", "Sports Participation (%)");
      renderBarChart(obesityTop10, "#obesityChart", "Obesity Rate (%)");
    }
  });
  