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

// Função para gerar gráficos com D3.js
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

    // Definir as cores para as barras de cada país
    const colors = [
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'
    ];

    // Definir as margens e dimensões para o gráfico
    const margin = { top: 30, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    console.log(dataByCountry)
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
