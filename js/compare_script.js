let charts = [];
var dataByCountry = {};

// Aguardar o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function () {
    // Carregar dados via D3.js
    Promise.all([
        d3.json("https://d3js.org/world-110m.v1.json"),
        d3.csv("dataset/dataset.csv")
    ]).then(function ([worldData, csvData]) {
        var countries = topojson.feature(worldData, worldData.objects.countries).features;
        dataByCountry = {};

        // Organizar os dados CSV por país, grupo e gênero
        csvData.forEach(function (d) {
            if (d['Country']) {
                if (!dataByCountry[d['Country']]) {
                    dataByCountry[d['Country']] = { children: {}, adult: {} };
                }
                dataByCountry[d['Country']][d.Group.toLowerCase()][d.Gender.toLowerCase()] = {
                    "Obesity Rate (%)": d["Obesity Rate (%)"],
                    "Football (%)": d["Football (%)"],
                    "Basketball (%)": d["Basketball (%)"],
                    "Running (%)": d["Running (%)"]
                };
            }
        });

        // Preencher o dropdown com os países
        var dropdownContent = d3.select("#dropdown-content");
        countries.forEach(function (country) {
            var countryName = country.properties.name;
            dropdownContent.append("label")
                .append("input")
                .attr("type", "checkbox")
                .attr("value", countryName)
                .on("change", function () { selectCountry(this) });
            dropdownContent.append("text").text(countryName).append("br");
        });
    });


    function generateCharts() {
        // Verificar se os gráficos já foram criados e destruí-los
        if (charts.length > 0) {
            charts.forEach(chart => chart.remove()); // Remover gráficos anteriores
            charts = [];
        }

        // Remover os elementos de canvas antigos
        const chartContainer = document.getElementById('charts-container');
        chartContainer.innerHTML = ''; // Limpa o container

        // Recuperar os países selecionados (códigos ISO)
        const selectedCountries = [];
        document.querySelectorAll('.dropdown-content input[type="checkbox"]:checked').forEach(checkbox => {
            selectedCountries.push(checkbox.value);  // Aqui pegamos o nome do país
        });

        // Recuperar os gêneros selecionados
        const selectedGenders = [];
        document.querySelectorAll('.selection-group .gender:checked').forEach(checkbox => {
            selectedGenders.push(checkbox.value);  // Aqui pegamos o valor do gênero (Male ou Female)
        });

        // Recuperar as faixas etárias selecionadas
        const selectedAgeGroups = [];
        document.querySelectorAll('.selection-group .age:checked').forEach(checkbox => {
            selectedAgeGroups.push(checkbox.value);  // Aqui pegamos a faixa etária (Children ou Adult)
        });

        // Recuperar as métricas selecionadas
        const selectedMetrics = [];
        document.querySelectorAll('.selection-group .metric:checked').forEach(checkbox => {
            selectedMetrics.push(checkbox.value);  // Aqui pegamos o valor da métrica
        });

        // Agora você tem os valores selecionados para países, gênero, faixa etária e métricas.
        console.log('Países selecionados:', selectedCountries);
        console.log('Gêneros selecionados:', selectedGenders);
        console.log('Faixas etárias selecionadas:', selectedAgeGroups);
        console.log('Métricas selecionadas:', selectedMetrics);

        // Criar um array para armazenar os dados filtrados
        let filteredData = [];

        selectedCountries.forEach(country_name => {
            // Acessa os dados de um país específico pelo código ISO
            let countryData = dataByCountry[country_name];
            console.log(countryData)

            // Verifica se o dado do país existe
            if (countryData) {
                console.log("entrei");
                // Para cada grupo de faixa etária, gênero e métrica
                selectedAgeGroups.forEach(ageGroup => {
                    const ageGroupData = countryData[ageGroup.toLowerCase()];
                    console.log("dados para a faixa etária: ", ageGroupData);
                    selectedGenders.forEach(gender => {
                        console.log("gênero: " + gender);
                        const genderData = ageGroupData[gender.toLowerCase()];
                        console.log("dados para genero : ", genderData);
                        selectedMetrics.forEach(metric => {
                            // Se o nome do "metric" não contiver o "%" e o dado contiver, adicione-o
                            let metricWithPercent = metric
                                .replace(/participation/i, '')  // Remove a palavra "participation" (case insensitive)
                                .trim();  // Remove espaços em branco extras

                            // Se o nome da métrica não contiver o "%", adicione-o
                            metricWithPercent = metricWithPercent.includes('%') ? metricWithPercent : metricWithPercent + " (%)"; console.log("Métrica ajustada: " + metricWithPercent);
                            // Acesse o valor no objeto
                            let value = genderData[metricWithPercent];
                            console.log("value -> " + value)

                            if (value !== undefined) {
                                console.log("valor -> " + value);

                                // Se o valor estiver presente, adicione aos dados filtrados
                                filteredData.push({
                                    country: country_name,
                                    metric: metricWithPercent,
                                    value: parseFloat(value)  // Converte o valor para número
                                });
                            } else {
                                console.log("Métrica não encontrada para " + ageGroup + " " + gender + ": " + metricWithPercent);
                            }
                        });

                    });
                });
            }

        });

        // Definir dimensões do gráfico
        const margin = { top: 30, right: 30, bottom: 70, left: 60 };
        const width = 1300 - margin.left - margin.right;
        const height = 800 - margin.top - margin.bottom;

        // Definir o tooltip (inicialmente oculto)
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "14px")
            .style("pointer-events", "none");

        const svg = d3.select("#charts-container").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Definir escalas
        const xScale = d3.scaleBand()
            .domain(filteredData.map(d => d.country + " - " + d.metric.replace("(%)","") ))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.value)])
            .range([height, 0]);

        // Adicionar eixos
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            // .attr("transform", "rotate(-45)")
            .style("text-anchor", "middle");

        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Criar barras
        svg.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.country + " - " + d.metric.replace("(%)", "") ))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.value))
            .attr("fill", "steelblue")

            // Evento mouseover para mostrar o tooltip
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .text(`${d.country}: ${d.metric} - ${d.value.toFixed(2)}%`)  // Exibe o valor com 2 casas decimais
                    .style("top", (event.pageY - 40) + "px")  // Ajusta a posição do tooltip
                    .style("left", (event.pageX + 10) + "px");  // Ajusta a posição do tooltip
            })

            // Evento mouseout para esconder o tooltip
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });

        // Adicionar título
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Percentage (%)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Gráfico de Barras das Métricas Selecionadas");

        console.log(dataByCountry);
    }

    // Botão de gerar gráficos
    document.querySelector('#generate-btn').addEventListener('click', generateCharts);
});


// Função para gerar gráficos com D3.js



// Função para alternar o dropdown
function toggleDropdown() {
    document.querySelector(".dropdown").classList.toggle("show");
}

// Função para adicionar um país à lista de tags
function selectCountry(checkbox) {
    const country = checkbox.value;
    if (checkbox.checked) {
        addTag(country);
    } else {
        removeTag(country);
    }
}

// Função para adicionar tag ao país selecionado
function addTag(country) {
    const selectedTags = document.getElementById("selected-tags");

    // Verifica se o país já foi adicionado
    if (document.getElementById("tag-" + country)) return;

    const tag = document.createElement("div");
    tag.classList.add("selected-tag");
    tag.id = "tag-" + country;
    tag.innerHTML = `${country} <span class="remove-btn" onclick="removeTag('${country}')">&times;</span>`;
    selectedTags.appendChild(tag);
}

// Função para remover tag do país
function removeTag(country) {
    // Remove o elemento da tag
    const tag = document.getElementById("tag-" + country);
    if (tag) tag.remove();

    // Desmarca o checkbox no dropdown
    const dropdownCheckbox = document.querySelector(`.dropdown-content input[type="checkbox"][value="${country}"]`);
    if (dropdownCheckbox) dropdownCheckbox.checked = false;
}

window.onload = function () {
    // Limpar todos os checkboxes
    const checkboxes1 = document.querySelectorAll(".dropdown-content input[type='checkbox']");
    checkboxes1.forEach(checkbox1 => {
        checkbox1.checked = false;  // Desmarcar todos os checkboxes
    });

    const checkboxes2 = document.querySelectorAll(".selection-group input[type='checkbox']");
    checkboxes2.forEach(checkbox2 => {
        checkbox2.checked = false;  // Desmarcar todos os checkboxes
    });

    // Limpar as tags selecionadas
    const selectedTags = document.getElementById("selected-tags");
    selectedTags.innerHTML = "";  // Remove todas as tags
};