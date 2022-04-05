Ext.onReady(function(){
  let pokemon_modal = [];
  let qtpokemon     = 1;
  const pokemons    = [];

/*
  A classe Store encapsula um cache do lado do cliente de objetos Record 
  que fornecem dados de entrada para Components como o GridPanel , o ComboBox ou o DataView .

*/

  const store_value = new Ext.data.Store({
      reader: new Ext.data.ArrayReader({}, [
          {name: 'id'},
          {name: 'pokemon', type: 'string'},
          {name: 'peso', type: 'string'},
          {name: 'altura', type: 'string'},
          {name: 'tipo-um', type: 'string'},
          {name: 'tipo-dois', type: 'string'},
          {name: 'imagem', type: 'string'},
          {name: 'status', type: 'object'}
      ])
  });

  const gen_tipo = (tipo) => `<span class="${tipo}">${tipo}</span>`

  const grid_model = new Ext.grid.ColumnModel([
      {header: "ID", width: 55, sortable: true, dataIndex: 'id'},
      {header: "POKEMON", width: 220, sortable: true, dataIndex: 'pokemon', id:'pokemon-iten'},
      {header: "PESO", width: 65, sortable: true, dataIndex: 'peso'},
      {header: "ALTURA", width: 80, sortable: true, dataIndex: 'altura'},
      {header: "TIPO UM", width: 100, sortable: true, renderer: gen_tipo, dataIndex: 'tipo-um'},
      {header: "TIPO DOIS", width: 100, sortable: true, renderer: gen_tipo, dataIndex: 'tipo-dois'}
  ]);

  const gen_pokemon = ({id, name, weight, height, types, sprites, stats}) => {
    let segundo_tipo = (types.length === 1) ? 'vazio' : types[1].type.name; 
    let pokemon_name = name.toUpperCase();
    const statos = stats.reduce((acc, {base_stat, stat: { name } }) => ({ ...acc, [name]: base_stat}), {});
    return [id, pokemon_name, weight, height, types[0].type.name, segundo_tipo, sprites.front_default, statos];
  }

  const request_pokemon = (id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then((req) => req.json())
    .then((data) => gen_pokemon(data))
    .catch((error) => error);

  const gerar_pokemons = async () => {
    const valor = qtpokemon + 100;

    while(qtpokemon < valor) {
      if(qtpokemon <= 898) {
        const poke = await request_pokemon(qtpokemon);
        pokemons.push(poke);
      }
      qtpokemon += 1;
    }
    store_value.loadData(pokemons);
    loading.hide();
  };

  gerar_pokemons();

  const modal_pokemon = new Ext.Window({
    width: 775,
    modal: true,
    closeAction: 'hide', // Ele da hide no table
    resizable: false, // Remove o resize
    footer: false,
    hideBorders: false,
    header: true,
    bodyStyle: 'padding:10px;',
    html: '<div class="modal-pokemon-teste"></div>',
    y: 1, // Value top
    x: 990 // Value left
  });

  const grid = {
    columnWidth: 0.60,

    layout: 'fit',
    items: {
      xtype: 'grid',

      // Local Store
      ds: store_value, 

      // Local Grid
      cm: grid_model, 

      // Evento de click do grid
      sm: new Ext.grid.RowSelectionModel({
        singleSelect: true,
        listeners: { rowselect: (sm, row, rec) => { 
            document.querySelector('#image-pokemon').innerHTML = `<img src=${rec.data.imagem} >`
            Ext.getCmp("painel-pokemons").getForm().loadRecord(rec);
            pokemon_modal = rec.data;
            Ext.getCmp("button-dados").enable();
          }                    
        }
      }),
      
      autoExpandColumn: 'pokemon-iten',
      height: 400,
      title:'Pokemon Data',
      border: true,
    }
  };

  const ver_pokemon = {
    id: 'button-dados',
    text: 'DADOS DO POKEMON',
    disabled: true,
    handler: () => {
        modal_pokemon.show();
        modal_pokemon.update({html: pokemon_modal_html(pokemon_modal)});
        gen_chart(pokemon_modal.status);

    }
  };

  const form = {
    columnWidth: 0.4,
    xtype: 'fieldset',
    labelWidth: 120,
    title:'Pokemon detalhes',
    defaults: {width: 140, border:false}, 
    defaultType: 'textfield',
    autoHeight: true,
    bodyStyle: Ext.isIE ? 'padding:0 0 5px 15px;' : 'padding:10px 15px;',
    border: false,
    style: {
      "margin-left": "10px", 
      "margin-right": Ext.isIE6 ? (Ext.isStrict ? "-10px" : "-13px") : "0"  
    },
    items: [{
      fieldLabel: 'ID',
      name: 'id'
    },{
      fieldLabel: 'Pokemon',
      name: 'pokemon'
    },{
      fieldLabel: 'Altura',
      name: 'altura'
    },{
      fieldLabel: 'Tipo Um',
      name: 'tipo-um'
    },{
      fieldLabel: 'Tipo Dois',
      name: 'tipo-dois'
    }],
    buttons: [ver_pokemon],
    html: '<div id="image-pokemon"></div>'
  };

  const gridForm = new Ext.FormPanel({
      id: 'painel-pokemons',
      frame: true,
      labelAlign: 'rigth',
      title: 'Pokemon Painel',
      bodyStyle:'padding:5px',
      width: 990,
      layout: 'column',    
      items: [grid, form],
  });

  const loading = new Ext.Window({
    width: 400,
    minWidth: 350,
    height: 350,
    modal: true,
    closable: false, // Button close desabilitado
    resizable: false, // Remove o resize
    footer: false,
    hideBorders: false,
    header: true,
    bodyStyle: 'padding:10px;',
    html: '<img src="./imgs/carregando.gif" >',
  });

  const gen_chart = (pokemon) => new Chart(document.getElementById("pokemon-status"), {
    type: 'bar',
    data: {
      labels: ["ATTACK", "DEFENSE", "HP", "SPECIAL-ATTACK", "SPECIAL-DEFENSE", "SPEED"],
      datasets: [
        {
          label: "Power",
          backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850", "#EEDE7B"],
          data: [pokemon.attack, pokemon.defense, pokemon.hp, pokemon['special-attack'], pokemon['special-defense'], pokemon.speed],
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  const pokemon_modal_html = (pokemon) => {
    return `
      <div class="pokemon-modal back-normal">
        <img class="img-modal" src="${pokemon.imagem}" >
        <div class="local-canvas"><canvas id="pokemon-status"></canvas></div>
      </div>
    `
  }

  const button_load = new Ext.Button({
    text: 'CARREGAR MAIS POKEMON',
    handler: () => {
      gerar_pokemons();
      loading.show();
    },
  });

  gridForm.render('datefield');
  button_load.render('button-load');
  loading.show();
});
