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
            if (d['ISO Code']) {
                if (!dataByCountry[d['ISO Code']]) {
                    dataByCountry[d['ISO Code']] = { children: {}, adult: {} };
                }
                dataByCountry[d['ISO Code']][d.Group.toLowerCase()][d.Gender.toLowerCase()] = d;
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

    // Botão de gerar gráficos
    document.querySelector('#generate-btn').addEventListener('click', generateCharts);
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

    // Recuperar os países selecionados
    const selectedCountries = [];
    document.querySelectorAll('.dropdown-content input[type="checkbox"]:checked').forEach(checkbox => {
        selectedCountries.push(checkbox.value);
    });

    // Recuperar as métricas selecionadas
    const selectedMetrics = [];
    document.querySelectorAll('.selection-group .metric:checked').forEach(checkbox => {
        selectedMetrics.push(checkbox.value);
    });

    // Verifica se há países e métricas selecionados
    if (selectedCountries.length === 0 || selectedMetrics.length === 0) {
        alert('Selecione ao menos um país e uma métrica para gerar o gráfico.');
        return;
    }

    // Criar gráfico para cada métrica selecionada
    selectedMetrics.forEach(metric => {
        const data = selectedCountries.map(country => ({
            country,
            value: dataByCountry[country]?.adult?.male?.[metric] || 0
        }));

        // Configurações do gráfico
        const svg = d3.select(chartContainer)
            .append("svg")
            .attr("width", 800)
            .attr("height", 400);

        const margin = { top: 20, right: 30, bottom: 40, left: 90 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.value)])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.country))
            .range([0, height])
            .padding(0.1);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Eixos
        chart.append("g")
            .call(d3.axisLeft(y));
        
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Barras
        chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.country))
            .attr("width", d => x(d.value))
            .attr("height", y.bandwidth());
    });
}



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
