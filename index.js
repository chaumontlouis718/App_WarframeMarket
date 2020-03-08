window.$ = window.jQuery = require('jquery');
const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");
var liste_warframe = [
    "atlas", "ash", "banshee", "chroma", "ember", "equinox", "frost", "hydroid", "ivara", "limbo", "loki", "mag", "mesa", "mirage",
    "nekros", "nova", "nyx", "oberon", "rhino", "saryn", "trinity", "valkyr", "vauban", "volt", "wukong", "zephyr"
];

var requestAsync = function (url) {
    return new Promise((resolve, reject) => {
        var req = request(url, (err, response, body) => {
            if (err) return reject(err, response, body);
            resolve(JSON.parse(body));
        });
    });
};

function constructeur_urls(warframe) {
    return [{
        partie: "neuroptics",
        url: "https://api.warframe.market/v1/items/" +
            warframe +
            "_prime_neuroptics/orders"
    },
    {
        partie: "chassis",
        url: "https://api.warframe.market/v1/items/" +
            warframe +
            "_prime_chassis/orders"
    },
    {
        partie: "systems",
        url: "https://api.warframe.market/v1/items/" +
            warframe +
            "_prime_systems/orders"
    },
    {
        partie: "blueprint",
        url: "https://api.warframe.market/v1/items/" +
            warframe +
            "_prime_blueprint/orders"
    },
    {
        partie: "set",
        url: "https://api.warframe.market/v1/items/" + warframe + "_prime_set/orders"
    }
    ];
}


var getParallel = async function (warframe) {
    var tab_final = [];
    var liste_item = constructeur_urls(warframe);
    try {
        urls = liste_item.map(x => x.url);
        var data = await Promise.all(urls.map(requestAsync));
    } catch (err) {
        console.error(err);
    }
    tab_final.push({
        warframe: warframe,
        prix: 0
    });
    data.forEach(function (elem, index) {
        var tab_prix = [];
        elem.payload.orders.forEach(element => {
            var date_creation = new Date(element.creation_date);
            if (element.order_type == "sell" && element.user.status == "ingame") {
                tab_prix.push(element.platinum);
            }
        });
        tab_final.push({
            partie: liste_item[index].partie,
            prix: Math.min(...tab_prix)
        });
    });
    tab_final.push({
        partie: "set en cumul",
        prix: tab_final.reduce((a, b) => a + b.prix, -tab_final[5].prix)
    });
    tab_final.push({
        partie: "diff",
        prix: tab_final[tab_final.length - 2].prix - tab_final[tab_final.length - 1].prix
    });

    var row = document.createElement('tr');

    var cell_w = document.createElement("th");
    cell_w.classList.add("warframecell")
    var textnode_w = document.createTextNode(tab_final[0].warframe); 
    cell_w.appendChild(textnode_w);
    row.appendChild(cell_w)
    for (var i = 1; i < tab_final.length; i++) {
        var cell = document.createElement("th");              
        var textnode = document.createTextNode(tab_final[i].prix);    
        cell.appendChild(textnode);
        row.appendChild(cell)
    }
    $('#results > tbody:last-child').append(row);
};

async function asyncForEach(array, callback) {
    $("#reset").prop('disabled', true);
    for (warframe of liste_warframe) {
        await getParallel(warframe);
    }
    $("#reset").prop('disabled', false);
}

$("#fetchresults").on("click", function () {
    $("#fetchresults").prop('disabled', true);
    asyncForEach()
});

$("#reset").on("click", function () {
    $("#fetchresults").prop('disabled', false);
    $('#results>tbody').html("")
});

$("thead>tr>th").on("click",function() {
    sortTable($('#results'),$(this), 'asc')
})



function colToSort(col) {
    if (col.text() == "Warframe") return 1;
    if (col.text() == "Neuroptics") return 2;
    if (col.text() == "Chassis") return 3;
    if (col.text() == "Systems") return 4;
    if (col.text() == "Blueprint") return 5;
    if (col.text() == "Full Set") return 6;
    if (col.text() == "Stacking Set") return 7;
    if (col.text() == "Balance") return 8;
}

function sortTable(table, col, order) {
    var asc = order === 'asc'
    var tbody = table.find('tbody');
    var column = colToSort(col)
    tbody.find('tr').sort(function (a, b) {
        if (column != 1) {
            if (asc) {
                return ($('th:nth-child('+column+')', a).text() - $('th:nth-child('+column+')', b).text())
            } else {
                return ($('th:nth-child('+column+')', a).text() + $('th:nth-child('+column+')', b).text())
            }
        } else {
            if (asc) {
                return $('th:nth-child('+column+')', a).text().localeCompare($('th:nth-child('+column+')', b).text());
            } else {
                return $('th:nth-child('+column+')', b).text().localeCompare($('th:nth-child('+column+')', a).text());
            }
        }
        
    }).appendTo(tbody);
}