// Variável para armazenar os gráficos gerados
let charts = [];

// Função para gerar gráficos
function generateCharts() {
    // Verificar se os gráficos já foram criados e destruí-los
    if (charts.length > 0) {
        charts.forEach(chart => chart.destroy()); // Destruir gráficos anteriores
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
    document.querySelectorAll('.metric:checked').forEach(checkbox => {
        selectedMetrics.push(checkbox.value);
    });

    // Definir as cores para as barras de cada país
    const colors = [
        'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'
    ];
    const borderColors = [
        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
    ];

    // Recuperar os dados para cada país e cada métrica
    const datasets = selectedCountries.map((country, index) => {
        const data = selectedMetrics.map(metric => {
            // Substitua a lógica abaixo para obter dados reais
            if (metric === 'Obesidade (%)') {
                return Math.floor(Math.random() * 50);  // Valor aleatório para obesidade
            } else if (metric === 'Futebol (%)') {
                return Math.floor(Math.random() * 100);  // Valor aleatório para futebol
            }
            return 0;
        });

        return {
            label: country,
            data: data,
            backgroundColor: colors[index % colors.length], // Cor de fundo
            borderColor: borderColors[index % borderColors.length], // Cor da borda
            borderWidth: 1
        };
    });

    // Criar o canvas dinamicamente para o gráfico
    const ctx = document.createElement('canvas');
    ctx.classList.add('chart');  // Adicionar classe 'chart' para o styling
    chartContainer.appendChild(ctx); // Adicionar o canvas ao container de gráficos

    // Criar o gráfico com os datasets
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: selectedMetrics,  // Métricas como rótulos
            datasets: datasets // Todos os datasets dos países
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw + '%';  // Formatar tooltip
                        }
                    }
                }
            }
        }
    });

    charts.push(chart); // Adicionar o gráfico à lista de gráficos
}

// Aguardar o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function () {
    // Carregar dados via D3.js
    Promise.all([
        d3.json("https://d3js.org/world-110m.v1.json"),
        d3.csv("dataset/dataset.csv")
    ]).then(function ([worldData, csvData]) {
        var countries = topojson.feature(worldData, worldData.objects.countries).features;
        var dataByCountry = {};

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




window.onload = function () {
    // Limpar todos os checkboxes
    const checkboxes = document.querySelectorAll(".dropdown-content input[type='checkbox']");
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;  // Desmarcar todos os checkboxes
    });

    // Limpar as tags selecionadas
    const selectedTags = document.getElementById("selected-tags");
    selectedTags.innerHTML = "";  // Remove todas as tags
};


// Carregar dados via D3.js
Promise.all([
    d3.json("https://d3js.org/world-110m.v1.json"),
    d3.csv("dataset/dataset.csv")
]).then(function ([worldData, csvData]) {
    var countries = topojson.feature(worldData, worldData.objects.countries).features;
    var dataByCountry = {};

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
    const tag = document.getElementById("tag-" + country);
    if (tag) tag.remove();
}

// Gerar gráficos
let chart1 = null;
let chart2 = null;

// Gerar gráficos com base nas seleções
// Gerar gráficos com base nas seleções
