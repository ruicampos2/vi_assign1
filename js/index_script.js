var width = window.innerWidth / 2, height = window.innerHeight * 0.85;
var projection = d3.geoMercator()
  .scale(window.innerWidth / 13)
  .translate([width / 2, height / 1.7]);

var path = d3.geoPath().projection(projection);
var sportColorScale = d3.scaleQuantize().domain([0, 50]).range(d3.schemeBlues[9]);
var obesityColorScale = d3.scaleQuantize().domain([0, 50]).range(d3.schemeYlOrBr[9]);

var selectedFilters = { ageGroup: "children", gender: "male" }; // Valor inicial


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
  
      // Obtém valores de participação em cada desporto
      const football = parseFloat(d['Football (%)']) || 0;
      const basketball = parseFloat(d['Basketball (%)']) || 0;
      const running = parseFloat(d['Running (%)']) || 0;
  
      // Calcula a média de participação de desportos
      const averageSportsParticipation = ((football + basketball + running) / 3).toFixed(2);
  
      // Armazena o valor calculado no conjunto de dados
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
  
        if (countryData) {
          var selectedData = countryData[selectedFilters.ageGroup][selectedFilters.gender];
          if (selectedData) {
            // Define o valor a ser utilizado na escala de cores com base no tipo de dado
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
            
            // Exibe o valor correto no popup com base no tipo de dado
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
      });
  
    var zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", function (event) {
        svg.selectAll("path").attr("transform", event.transform);
      });
    svg.call(zoom);
  }
  
  

  function drawMaps() {
    drawMap("#map1", "sports", "Taxa da Prática de Desporto Mundial", sportColorScale);
    drawMap("#map2", "obesity", "Taxa de Obesidade Mundial", obesityColorScale);
  }

  drawMaps(); // Desenha os mapas inicialmente


  function updateFilters() {
    // Atualiza selectedFilters com os valores das checkboxes
    selectedFilters.ageGroup = document.querySelector("input[name='ageGroup']:checked").value;
    selectedFilters.gender = document.querySelector("input[name='gender']:checked").value;
    drawMaps(); // Redesenha os mapas com os filtros atualizados
  }
  document.getElementById("generateBtn").addEventListener("click", updateFilters);


}).catch(function (error) {
  console.error("Erro ao carregar os dados: ", error);
});