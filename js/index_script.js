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

Promise.all([
  d3.json("https://d3js.org/world-110m.v1.json"),
  d3.csv("dataset/dataset.csv")
]).then(function ([worldData, csvData]) {
  var countries = topojson.feature(worldData, worldData.objects.countries).features;
  var dataByCountry = {};

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

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("fill", "#333")
      .text(title);

    svg.selectAll("path")
      .data(countries)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", function (d) {
        var countryCode = d.id;
        var countryData = dataByCountry[countryCode];

        // Verifica se o país está selecionado e aplica a cor de destaque
        if (selectedCountryCodes.has(countryCode)) {
          return "#FF0000"; // Cor de destaque para os países selecionados
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
        return "#ccc"; // Cor padrão quando não há dados
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
          selectedCountryCodes.delete(countryCode); // Desmarca o país se já estiver selecionado
          selectCountry(dataByCountry[countryCode])
        } else {
          selectedCountryCodes.add(countryCode); // Seleciona o país
          selectCountry(dataByCountry[countryCode])
        }
        drawMaps(); // Redesenha os mapas para aplicar a cor de destaque
      });

    var zoom = d3.zoom()
      .scaleExtent([1, 8])  // Limita o zoom entre 1x e 8x
      .translateExtent([[0, 0], [width, height]])  // Define os limites de movimento para o mapa
      .on("zoom", function (event) {
        svg.selectAll("path").attr("transform", event.transform);
      });

    svg.call(zoom);
  }

  function drawMaps() {
    drawMap("#map1", "sports", "Taxa da Prática de Desporto Mundial", sportColorScale);
    drawMap("#map2", "obesity", "Taxa de Obesidade Mundial", obesityColorScale);
  }

  drawMaps();

  function updateFilters() {
    selectedFilters.ageGroup = document.querySelector("input[name='ageGroup']:checked").value;
    selectedFilters.gender = document.querySelector("input[name='gender']:checked").value;
    drawMaps();
  }

  document.getElementById("generateBtn").addEventListener("click", updateFilters);

}).catch(function (error) {
  console.error("Erro ao carregar os dados: ", error);
});


// Exemplo para adicionar país selecionado ao localStorage
function selectCountry(countryObj) {
  let country_value = null
  // Itera através do objeto para extrair o nome do país
  for (const ageGroup in countryObj) {
    const genderData = countryObj[ageGroup];

    for (const gender in genderData) {
      const countryData = genderData[gender];
      if (!countryNames.includes(countryData.Country)) {
        // Adiciona o nome do país se ainda não estiver na lista
        countryNames.push(countryData.Country);
        country_value = countryData.Country
      }else{
        country_value = countryData.Country
      }
    }
  }
  // Obtém os países selecionados previamente no localStorage
  let selectedCountries = JSON.parse(localStorage.getItem("selectedCountries")) || [];
  console.log(selectedCountries)

  // Adiciona ou remove cada país da lista de selecionados
  if (selectedCountries.includes(country_value)) {
    console.log(country_value)
    // Remove o país se já estiver selecionado
    selectedCountries = selectedCountries.filter(c => c !== country_value);
    // n é bem isto mas tenho q arranjar maneira de os remover 
  } else {
    // Adiciona o país se ainda não estiver selecionado
    selectedCountries.push(country_value);
  }

  // Atualiza o localStorage com a lista atualizada de países
  localStorage.setItem("selectedCountries", JSON.stringify(selectedCountries));

  // Exibe os países selecionados no console para verificação
  console.log("Países selecionados:", selectedCountries);
}



