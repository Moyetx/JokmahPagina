/* Datos iniciales del sitio (se cargan la primera vez en modo local
   y sirven de referencia para el contenido en modo online). */
(function () {
  "use strict";

  const S = {};

  S.ESTADOS = [
    "Laico", "Sacerdote", "Diácono", "Diácono Permanente", "Laico consagrado",
    "Fraile", "Monje", "Monja", "Hermana", "Virgen Consagrada",
    "Seminarista", "Pre-seminarista", "Seglar", "Terciario"
  ];

  S.TIEMPOS = [
    { id: "adviento", nombre: "Adviento", color: "morado" },
    { id: "navidad", nombre: "Navidad", color: "blanco" },
    { id: "ordinario", nombre: "Tiempo Ordinario", color: "verde" },
    { id: "cuaresma", nombre: "Cuaresma", color: "morado" },
    { id: "triduo", nombre: "Triduo Pascual", color: "rojo" },
    { id: "pascua", nombre: "Pascua", color: "blanco" }
  ];

  S.COLORES_LITURGICOS = {
    verde: { nombre: "Verde", css: "#3f7d4e" },
    morado: { nombre: "Morado", css: "#6b4a8f" },
    blanco: { nombre: "Blanco", css: "#c2a94e" },
    rojo: { nombre: "Rojo", css: "#a33434" },
    rosa: { nombre: "Rosa", css: "#c97ba2" },
    dorado: { nombre: "Dorado", css: "#b78435" }
  };

  S.ajustes = {
    nombre: "Jokmah",
    lema: "Grupo juvenil de formación católica",
    logo: null,
    mision: "Formar a los jóvenes en la fe católica a través del estudio, la oración y la vida comunitaria, ofreciendo respuestas claras y fundamentadas a las preguntas que la vida plantea, para que nadie tenga que elegir entre pensar y creer.",
    objetivo: "Que cada miembro del grupo conozca, ame y viva su fe con profundidad, y sepa dar razón de su esperanza (cf. 1 P 3, 15) en su casa, su estudio, su trabajo y su parroquia.",
    redes: [
      { nombre: "Instagram", url: "" },
      { nombre: "YouTube", url: "" },
      { nombre: "WhatsApp", url: "" }
    ],
    fondo: null,
    lateralIzq: null,
    lateralDer: null,
    veloFondo: 0.9
  };

  S.secciones = [
    { id: "tiempo-liturgico", nombre: "Tiempo Litúrgico", descripcion: "Preguntas ordenadas según el año de la Iglesia: Adviento, Navidad, Cuaresma, Pascua y Tiempo Ordinario.", orden: 0, liturgico: true },
    { id: "catecismo", nombre: "Catecismo", descripcion: "Lo que la Iglesia cree, celebra, vive y reza, explicado desde el Catecismo.", orden: 1 },
    { id: "dsi", nombre: "Doctrina Social", descripcion: "DSI: la enseñanza de la Iglesia sobre la vida en sociedad, el trabajo y la justicia.", orden: 2 },
    { id: "teologia-del-cuerpo", nombre: "Teología del Cuerpo", descripcion: "Las catequesis de san Juan Pablo II sobre el amor humano en el plan divino.", orden: 3 },
    { id: "derecho-canonico", nombre: "Derecho Canónico", descripcion: "Las leyes de la Iglesia y el porqué de sus normas.", orden: 4 },
    { id: "teologia", nombre: "Teología", descripcion: "Fe que busca comprender: Dios, la creación, la gracia y los sacramentos.", orden: 5 },
    { id: "patristica", nombre: "Patrística", descripcion: "Los Padres de la Iglesia: los primeros siglos hablan al presente.", orden: 6 },
    { id: "discernimiento", nombre: "Discernimiento", descripcion: "Cómo reconocer la voluntad de Dios en las decisiones de la vida.", orden: 7 },
    { id: "liturgia", nombre: "Liturgia", descripcion: "El sentido de los ritos, los signos y las celebraciones.", orden: 8 },
    { id: "carismas", nombre: "Carismas", descripcion: "Dones del Espíritu para la edificación de la Iglesia.", orden: 9 },
    { id: "santos", nombre: "Santos", descripcion: "Vidas que demuestran que el Evangelio se puede vivir.", orden: 10 }
  ];

  S.preguntas = [
    {
      id: "p-confesion",
      pregunta: "¿Por qué confesarse con un sacerdote y no directamente con Dios?",
      etiquetas: ["catecismo", "teologia"],
      tiempo: null,
      publicada: true,
      creada: "2026-06-02T10:00:00.000Z",
      vistas: 87, likes: 24, dislikes: 2,
      corta: {
        respuesta: "Porque el perdón que Cristo ganó en la cruz quiso entregarlo a través de su Iglesia: el Resucitado dio a los Apóstoles el poder de perdonar los pecados (Jn 20, 22-23). El sacerdote no sustituye a Dios: actúa en su nombre. La absolución nos da la certeza audible del perdón, nos reconcilia con la comunidad herida por nuestro pecado y nos ofrece consejo para no volver a caer.",
        fuentes: [
          "Jn 20, 21-23",
          "Catecismo de la Iglesia Católica, 1441-1445",
          "Santo Tomás de Aquino, Suma Teológica, Supl., q. 8, a. 1"
        ]
      },
      larga: {
        cuestionNum: 1,
        cuestionTitulo: "Sobre el sacramento de la Penitencia",
        articuloNum: 1,
        articuloTitulo: "¿Es necesario confesar los pecados a un sacerdote, o basta pedir perdón directamente a Dios?",
        objeciones: [
          "Parece que basta pedir perdón directamente a Dios. Pues solo Dios puede perdonar los pecados (cf. Mc 2, 7); luego resulta superfluo acudir a un hombre que no puede dar lo que no es suyo.",
          "Además, el que se arrepiente de corazón ya ha sido perdonado, como muestra el salmo: «Confesaré mis culpas al Señor, y tú perdonaste mi pecado» (Sal 32, 5). Luego la confesión ante el sacerdote nada añade al arrepentimiento interior.",
          "Además, confesar los propios pecados a otro hombre humilla y avergüenza; y Dios, que es misericordioso, no impone cargas inútiles a sus hijos."
        ],
        enCambio: "En cambio, el Señor resucitado dijo a los Apóstoles: «Recibid el Espíritu Santo; a quienes perdonéis los pecados, les quedan perdonados; a quienes se los retengáis, les quedan retenidos» (Jn 20, 22-23). Ahora bien, nadie puede perdonar o retener lo que no conoce; luego Cristo quiso que los pecados fueran declarados a los Apóstoles y a sus sucesores.",
        solucion: "Respondo diciendo que en el perdón de los pecados hay que considerar dos cosas: el autor de la gracia, que es solo Dios, y el modo en que esa gracia llega al hombre, que pertenece a la economía sacramental querida por Cristo [1].\n\nDios no necesita mediaciones, pero el hombre sí las necesita, porque es criatura corpórea y social: peca con el cuerpo y dentro de una comunidad, y por eso conviene que reciba el perdón de modo sensible y eclesial. El sacerdote actúa in persona Christi, de manera que quien oye la absolución no escucha la opinión de un hombre, sino la palabra eficaz de Cristo [2].\n\nAdemás, la confesión responde a la condición del penitente: al decir el pecado en voz alta, el hombre se conoce con verdad, recibe un juicio de misericordia que no puede fabricarse a sí mismo y obtiene una paz cierta que la sola conciencia no alcanza a darse [3].",
        respuestas: [
          "A la primera hay que decir que solo Dios perdona los pecados como causa principal; el sacerdote perdona como instrumento y ministro, del mismo modo que en el Bautismo es Dios quien santifica aunque sea un hombre quien derrama el agua.",
          "A la segunda hay que decir que la contrición perfecta obtiene ya el perdón, pero incluye por sí misma el propósito de acudir al sacramento; quien desprecia el medio querido por Cristo muestra que su arrepentimiento no es entero.",
          "A la tercera hay que decir que la vergüenza de la confesión no es carga inútil sino parte de la medicina: humilla el orgullo, raíz del pecado, y la supera con creces la alegría de oír con los propios oídos: «Yo te absuelvo»."
        ],
        notas: [
          "Catecismo de la Iglesia Católica, 1441: «Solo Dios perdona los pecados».",
          "Catecismo de la Iglesia Católica, 1465; cf. Suma Teológica, Supl., q. 8, a. 1.",
          "Cf. Concilio de Trento, sesión XIV, cap. 3."
        ]
      }
    },
    {
      id: "p-adviento",
      pregunta: "¿Qué es el Adviento y por qué la liturgia todavía no canta la Navidad?",
      etiquetas: ["tiempo-liturgico", "liturgia"],
      tiempo: "adviento",
      publicada: true,
      creada: "2026-06-10T10:00:00.000Z",
      vistas: 54, likes: 18, dislikes: 1,
      corta: {
        respuesta: "El Adviento abre el año litúrgico: cuatro semanas para esperar la venida del Señor, la que celebramos en Navidad y la definitiva al final de la historia. La Iglesia reserva los cantos de Navidad para Navidad porque la espera educa el deseo: la sobriedad del Adviento —morado, sin Gloria— hace más honda la alegría de la Nochebuena, como el ayuno hace más sabrosa la fiesta.",
        fuentes: [
          "Normas universales sobre el año litúrgico, 39-42",
          "Catecismo de la Iglesia Católica, 524"
        ]
      },
      larga: {
        cuestionNum: 2,
        cuestionTitulo: "Sobre el año litúrgico",
        articuloNum: 1,
        articuloTitulo: "¿Conviene que la Iglesia celebre un tiempo de espera antes de la Navidad?",
        objeciones: [
          "Parece que no conviene, pues Cristo ya vino hace veinte siglos; esperar lo que ya sucedió es representar una ficción, y la liturgia no debe fingir.",
          "Además, la alegría cristiana no debe aplazarse: «Alegraos siempre en el Señor» (Flp 4, 4). Luego retrasar los cantos de Navidad contradice el Evangelio."
        ],
        enCambio: "En cambio, enseña el Catecismo: «Al celebrar anualmente la liturgia de Adviento, la Iglesia actualiza esta espera del Mesías: participando en la larga preparación de la primera venida del Salvador, los fieles renuevan el ardiente deseo de su segunda venida» [1].",
        solucion: "Respondo diciendo que la liturgia no repite el pasado como un teatro, sino que hace presente el misterio y dispone al hombre para recibirlo. El Adviento mira a la vez a tres venidas: la histórica en Belén, la sacramental en la gracia de cada día y la escatológica al fin de los tiempos [2].\n\nPor eso la espera no es ficción sino verdad de nuestra condición: todavía no vemos a Dios cara a cara. La sobriedad del tiempo —el morado, la omisión del Gloria, los cantos contenidos— es pedagogía del deseo: la Iglesia, como buena madre, sabe que solo desea bien quien aprende a esperar.",
        respuestas: [
          "A la primera hay que decir que el Adviento no finge que Cristo no ha nacido: actualiza nuestra necesidad de que nazca en nosotros y sostiene la espera de su venida gloriosa, que aún no ha sucedido.",
          "A la segunda hay que decir que el Adviento no suprime la alegría sino que la ordena: el tercer domingo se llama precisamente Gaudete, «alegraos». La alegría contenida de la espera y la alegría desbordada de la fiesta son dos tiempos de una misma música."
        ],
        notas: [
          "Catecismo de la Iglesia Católica, 524.",
          "Cf. San Bernardo de Claraval, Sermón 5 de Adviento."
        ]
      }
    },
    {
      id: "p-vocacion",
      pregunta: "¿Cómo sé si Dios me llama a un estado de vida concreto?",
      etiquetas: ["discernimiento"],
      tiempo: null,
      publicada: true,
      creada: "2026-06-20T10:00:00.000Z",
      vistas: 61, likes: 21, dislikes: 3,
      corta: {
        respuesta: "Dios no suele llamar con voces del cielo sino con signos convergentes: un deseo hondo y estable que crece en la oración, unas aptitudes reales confirmadas por quienes te conocen, y la paz que deja cada paso dado en esa dirección. Discernir pide vida de gracia, acompañamiento espiritual y tiempo; y al final, decidir: la vocación se confirma caminando, no mirándola desde la orilla.",
        fuentes: [
          "1 S 3, 1-10",
          "San Ignacio de Loyola, Ejercicios Espirituales, 169-189",
          "Francisco, Christus vivit, 283-286"
        ]
      },
      larga: {
        cuestionNum: 3,
        cuestionTitulo: "Sobre el discernimiento vocacional",
        articuloNum: 1,
        articuloTitulo: "¿Puede el hombre conocer con certeza el estado de vida al que Dios lo llama?",
        objeciones: [
          "Parece que no, porque «¿quién conoció la mente del Señor?» (Rm 11, 34); los designios de Dios son inescrutables y pretender conocerlos es presunción.",
          "Además, si Dios quisiera un estado concreto para cada uno, lo manifestaría claramente, pues quiere que todos se salven; y la experiencia muestra que la mayoría duda. Luego Dios no llama a estados concretos."
        ],
        enCambio: "En cambio, el Señor dijo a sus discípulos: «No me habéis elegido vosotros a mí, sino que yo os he elegido a vosotros» (Jn 15, 16); y a Samuel le bastó aprender a escuchar: «Habla, Señor, que tu siervo escucha» (1 S 3, 10).",
        solucion: "Respondo diciendo que Dios llama de ordinario por medios ordinarios: la naturaleza que dio, las circunstancias que dispone y las inclinaciones santas que siembra en el corazón [1]. Por eso el discernimiento no es descifrar un enigma, sino leer con honestidad la propia vida delante de Dios.\n\nTres signos concurren: el deseo recto y estable, probado en la oración y no nacido del miedo ni de la vanidad; la idoneidad, es decir, las aptitudes reales para ese estado, que otros pueden confirmar mejor que uno mismo; y la paz duradera, que san Ignacio llama consolación, al caminar en esa dirección [2].\n\nLa certeza que se alcanza no es matemática sino prudencial: la suficiente para comprometerse. Dios, que llama, no abandona al que responde; y su providencia sabe escribir recto incluso con los renglones torcidos de nuestras decisiones.",
        respuestas: [
          "A la primera hay que decir que los designios de Dios son inescrutables en sí mismos, pero Él los manifiesta en lo que necesitamos para obrar: «lámpara es tu palabra para mis pasos» (Sal 119, 105). No es presunción buscar lo que Dios quiere que se busque.",
          "A la segunda hay que decir que la duda no prueba la ausencia de llamada sino la condición del caminante; Dios respeta la libertad y quiere hijos que elijan, no piezas que encajen. Por eso su llamada pide discernimiento y no lo suple."
        ],
        notas: [
          "Cf. Suma Teológica, I-II, q. 91, a. 2: la ley eterna participada en la criatura racional.",
          "San Ignacio de Loyola, Ejercicios Espirituales, 316-336 (reglas de discernimiento)."
        ]
      }
    }
  ];

  S.temporadas = [
    { id: "t-navidad-1", nombre: "Navidad", inicio: "2025-12-25", fin: "2026-01-11", color: "blanco" },
    { id: "t-ord-1", nombre: "Tiempo Ordinario", inicio: "2026-01-12", fin: "2026-02-17", color: "verde" },
    { id: "t-cuaresma", nombre: "Cuaresma", inicio: "2026-02-18", fin: "2026-04-01", color: "morado" },
    { id: "t-triduo", nombre: "Triduo Pascual", inicio: "2026-04-02", fin: "2026-04-04", color: "rojo" },
    { id: "t-pascua", nombre: "Pascua", inicio: "2026-04-05", fin: "2026-05-24", color: "blanco" },
    { id: "t-ord-2", nombre: "Tiempo Ordinario", inicio: "2026-05-25", fin: "2026-11-28", color: "verde" },
    { id: "t-adviento", nombre: "Adviento", inicio: "2026-11-29", fin: "2026-12-24", color: "morado" },
    { id: "t-navidad-2", nombre: "Navidad", inicio: "2026-12-25", fin: "2027-01-10", color: "blanco" }
  ];

  S.eventos = [
    { id: "e-carmen", fecha: "2026-07-16", titulo: "Nuestra Señora del Carmen", detalle: "Memoria. Encomendamos el grupo a la Virgen.", color: "blanco" },
    { id: "e-formacion-1", fecha: "2026-07-18", titulo: "Sesión de formación: los sacramentos", detalle: "Salón parroquial, 17:00. Trae Biblia y cuaderno.", color: "dorado" },
    { id: "e-santiago", fecha: "2026-07-25", titulo: "Santiago Apóstol", detalle: "Fiesta del patrono de los peregrinos.", color: "rojo" },
    { id: "e-formacion-2", fecha: "2026-08-01", titulo: "Sesión de formación: oración y vida", detalle: "Salón parroquial, 17:00.", color: "dorado" },
    { id: "e-asuncion", fecha: "2026-08-15", titulo: "Asunción de la Virgen María", detalle: "Solemnidad. Misa solemne y convivencia.", color: "blanco" },
    { id: "e-adviento", fecha: "2026-11-29", titulo: "Primer domingo de Adviento", detalle: "Comienza el nuevo año litúrgico.", color: "morado" },
    { id: "e-navidad", fecha: "2026-12-25", titulo: "Natividad del Señor", detalle: "Solemnidad.", color: "blanco" }
  ];

  /* Santoral: fecha recurrente MM-DD */
  S.santoral = [
    { id: "s-0101", fecha: "01-01", santo: "Santa María, Madre de Dios", nota: "Solemnidad" },
    { id: "s-0128", fecha: "01-28", santo: "Santo Tomás de Aquino", nota: "Doctor de la Iglesia" },
    { id: "s-0319", fecha: "03-19", santo: "San José, esposo de la Virgen", nota: "Solemnidad" },
    { id: "s-0629", fecha: "06-29", santo: "San Pedro y San Pablo", nota: "Solemnidad" },
    { id: "s-0703", fecha: "07-03", santo: "Santo Tomás Apóstol", nota: "Fiesta" },
    { id: "s-0711", fecha: "07-11", santo: "San Benito Abad", nota: "Patrono de Europa" },
    { id: "s-0716", fecha: "07-16", santo: "Nuestra Señora del Carmen", nota: "Memoria" },
    { id: "s-0722", fecha: "07-22", santo: "Santa María Magdalena", nota: "Fiesta" },
    { id: "s-0725", fecha: "07-25", santo: "Santiago Apóstol", nota: "Fiesta" },
    { id: "s-0729", fecha: "07-29", santo: "Santas Marta, María y Lázaro", nota: "Memoria" },
    { id: "s-0731", fecha: "07-31", santo: "San Ignacio de Loyola", nota: "Memoria" },
    { id: "s-0804", fecha: "08-04", santo: "San Juan María Vianney", nota: "Patrono de los párrocos" },
    { id: "s-0815", fecha: "08-15", santo: "Asunción de la Virgen María", nota: "Solemnidad" },
    { id: "s-1001", fecha: "10-01", santo: "Santa Teresa del Niño Jesús", nota: "Doctora de la Iglesia" },
    { id: "s-1101", fecha: "11-01", santo: "Todos los Santos", nota: "Solemnidad" },
    { id: "s-1208", fecha: "12-08", santo: "Inmaculada Concepción", nota: "Solemnidad" },
    { id: "s-1212", fecha: "12-12", santo: "Nuestra Señora de Guadalupe", nota: "Patrona de América" },
    { id: "s-1225", fecha: "12-25", santo: "Natividad del Señor", nota: "Solemnidad" }
  ];

  /* Fichas completas de santos (vista con galería, historia, milagros…) */
  S.santos = [
    {
      id: "santo-benito",
      nombre: "San Benito de Nursia",
      titulo: "Abad, patrono de Europa",
      fiesta: "07-11",
      nacimiento: "Nursia (Italia), hacia el año 480",
      fallecimiento: "Montecasino, 21 de marzo de 547",
      patronazgo: "Europa, monjes, estudiantes, agonizantes; invocado contra el veneno y las tentaciones",
      biografia: "Nació en Nursia, en la Umbría italiana, hacia el año 480, en una familia acomodada que lo envió a estudiar a Roma. La decadencia moral de la ciudad lo empujó a dejarlo todo: se retiró a una cueva en Subiaco, donde vivió tres años como ermitaño, aprendiendo en la soledad el arte de buscar a Dios.\n\nSu fama de santidad atrajo discípulos, y con ellos fue fundando pequeños monasterios. Hacia el año 529 se estableció en la cima de Montecasino, donde levantó la abadía que se convertiría en cuna del monacato occidental y escribió su Regla: un camino de vida sobrio y equilibrado, resumido en el lema «Ora et labora», reza y trabaja.\n\nBenito comprendió que Europa no se reconstruiría con las armas sino con la oración, el trabajo y la hospitalidad: sus monjes desecaron pantanos, copiaron manuscritos, enseñaron a cultivar la tierra y guardaron encendida la lámpara de la fe mientras caía el Imperio romano. Murió de pie, sostenido por sus discípulos, con las manos alzadas en oración, el 21 de marzo de 547.\n\nSan Pablo VI lo proclamó patrono de Europa en 1964, reconociendo que el continente le debe buena parte de su alma.",
      milagros: [
        "En Vicovaro, unos monjes descontentos intentaron envenenarlo; al bendecir la copa con la señal de la cruz, esta se quebró en pedazos como golpeada por una piedra.",
        "San Gregorio Magno narra que un cuervo acudía cada día a recibir pan de su mano, y que por orden del santo se llevó un pan envenenado que le habían enviado para matarlo.",
        "Por su oración brotó agua en la cima rocosa de un monte para tres monasterios que carecían de ella, y el hierro de una hoz hundido en el lago volvió a la superficie y se unió solo al mango.",
        "Vio en éxtasis el alma de su hermana, santa Escolástica, subir al cielo en forma de paloma tres días después de su última conversación."
      ],
      frases: [
        "Ora et labora: reza y trabaja.",
        "Que a Cristo no antepongan absolutamente nada, y que Él nos conduzca a todos juntos a la vida eterna. (Regla, cap. 72)",
        "Escucha, hijo, los preceptos del maestro e inclina el oído de tu corazón. (Regla, prólogo)",
        "El ocio es enemigo del alma. (Regla, cap. 48)"
      ],
      obras: [
        "La Regla de los monjes (Regula monachorum), fundamento del monacato de Occidente.",
        "La abadía de Montecasino y los doce monasterios de Subiaco.",
        "La red monástica benedictina que conservó la fe y la cultura clásica durante los siglos oscuros."
      ],
      extra: "Su medalla, con la cruz y las iniciales «Vade retro satana», es uno de los sacramentales más difundidos de la Iglesia. Su hermana gemela, santa Escolástica, fundó la rama femenina de la familia benedictina.",
      imagenes: []
    },
    {
      id: "santo-teresa-lisieux",
      nombre: "Santa Teresa del Niño Jesús",
      titulo: "Virgen, carmelita, doctora de la Iglesia",
      fiesta: "10-01",
      nacimiento: "Alenzón (Francia), 2 de enero de 1873",
      fallecimiento: "Lisieux, 30 de septiembre de 1897",
      patronazgo: "Misiones, misioneros, enfermos de tuberculosis, Francia",
      biografia: "Teresa Martin nació en Alenzón en 1873, la menor de nueve hermanos, hija de los santos Luis Martin y Celia Guérin. Perdió a su madre a los cuatro años y creció envuelta en una fe doméstica cálida y exigente a la vez.\n\nA los quince años, tras pedírselo al mismo papa León XIII en una audiencia, entró en el Carmelo de Lisieux. Allí vivió nueve años ocultos, sin nada exterior que contar: su grandeza fue descubrir el «caminito» de la infancia espiritual, la confianza total en el amor misericordioso de Dios, hecha de fidelidad en lo pequeño.\n\nEnferma de tuberculosis, atravesó al final de su vida una noche oscura de la fe que ofreció por los que no creen. Murió a los veinticuatro años diciendo: «Dios mío, os amo». Su autobiografía, Historia de un alma, publicada tras su muerte, recorrió el mundo.\n\nFue canonizada en 1925 y proclamada doctora de la Iglesia por san Juan Pablo II en 1997: la doctora de la ciencia del amor.",
      milagros: [
        "La «lluvia de rosas»: innumerables gracias y curaciones atribuidas a su intercesión desde su muerte, que ella misma había prometido: «Pasaré mi cielo haciendo el bien sobre la tierra».",
        "La curación súbita de la hermana Luisa de San Germán (1915) y la de Gabrielle Trimusi (1923), reconocidas para su beatificación y canonización.",
        "De niña, a los diez años, fue curada de una grave enfermedad al ver sonreír la imagen de la Virgen: la «sonrisa de la Virgen» del 13 de mayo de 1883."
      ],
      frases: [
        "Mi vocación es el amor: en el corazón de la Iglesia, mi Madre, yo seré el amor.",
        "Todo es gracia.",
        "Quiero pasar mi cielo haciendo el bien sobre la tierra.",
        "La santidad no está en tal o cual práctica: consiste en una disposición del corazón que nos hace humildes y pequeños en los brazos de Dios."
      ],
      obras: [
        "Historia de un alma (manuscritos autobiográficos A, B y C).",
        "Cartas, poesías y recreaciones piadosas escritas en el Carmelo.",
        "El «caminito» de infancia espiritual, propuesto a toda la Iglesia como camino de santidad."
      ],
      extra: "Es copatrona de las misiones junto a san Francisco Javier sin haber salido nunca de su convento. Sus padres, Luis y Celia Martin, son el primer matrimonio canonizado conjuntamente.",
      imagenes: []
    }
  ];

  /* Usuarios administradores (modo local).
     Credenciales iniciales: usuario "admin", contraseña "Jokmah2026".
     El hash es SHA-256; cámbiala desde el panel → Administradores. */
  S.usuarios = [
    {
      id: "u-admin",
      usuario: "admin",
      hash: "be084dd4a87dc3bb717d9355db8eec8c8f198941e1ee597893eec5f680409d07",
      creado: "2026-07-11T00:00:00.000Z"
    }
  ];
  S.HASH_INICIAL = "be084dd4a87dc3bb717d9355db8eec8c8f198941e1ee597893eec5f680409d07";

  S.buzon = [];
  S.quejas = [];
  S.registros = [];

  window.JSeed = S;
})();
