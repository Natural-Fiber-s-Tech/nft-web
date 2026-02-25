export const generalData = {
    es: {
        greeting: "¡Hola! Soy el asistente virtual de Fiberstech. ¿En qué puedo ayudarte hoy?",
        notFound: "Lo siento, no tengo esa información exacta. ¿Podrías intentar refrasear tu pregunta o contactar a un asesor?",
        placeholder: "Escribe tu pregunta...",
        toggleLabel: "English",
    },
    en: {
        greeting: "Hello! I am Fiberstech's virtual assistant. How can I help you today?",
        notFound: "I'm sorry, I don't have that exact information. Could you try rephrasing your question or contact an advisor?",
        placeholder: "Type your question...",
        toggleLabel: "Español",
    }
};

export const questions = [
    {
        "id": "precio_equipos",
        "isQuick": true,
        "showContact": true,
        "keywords": {
            "es": ["precio", "costo", "valor", "cotización", "tarifa", "presupuesto", "cuanto", "vale"],
            "en": ["price", "cost", "quote", "value", "rate", "budget", "much", "worth"]
        },
        "user_inputs": {
            "es": ["¿Cuánto cuestan los equipos?", "¿Me pueden dar una cotización?", "¿Qué precio tiene el caracterizador?"],
            "en": ["How much does the equipment cost?", "Can I get a quote?", "What is the price of the device?"]
        },
        "answer": {
            "es": "Para brindarte una cotización personalizada, por favor contacta a nuestro asesor humano vía WhatsApp. Ellos te darán los precios actualizados según el modelo que necesites.",
            "en": "To provide you with a personalized quote, please contact our human advisor via WhatsApp. They will give you updated prices according to the model you need."
        }
    },
    {
        "id": "metodos_pago",
        "isQuick": false,
        "showContact": true,
        "keywords": {
            "es": ["pago", "método", "tarjeta", "transferencia", "cuotas", "credito", "banco", "financiamiento"],
            "en": ["payment", "method", "card", "transfer", "installments", "credit", "bank", "finance"]
        },
        "user_inputs": {
            "es": ["¿Cómo puedo pagar?", "¿Aceptan tarjetas de crédito?", "¿Cuáles son las formas de pago?"],
            "en": ["How can I pay?", "Do you accept credit cards?", "What are the payment methods?"]
        },
        "answer": {
            "es": "Las opciones de pago se coordinan directamente con nuestro equipo comercial. Escríbenos por WhatsApp para que un asesor te guíe en el proceso de compra.",
            "en": "Payment options are coordinated directly with our commercial team. Write to us on WhatsApp so an advisor can guide you through the purchasing process."
        }
    },
    {
        "id": "envios_tiempo",
        "isQuick": false,
        "showContact": true,
        "keywords": {
            "es": ["envío", "tiempo", "entrega", "demora", "llegada", "despacho", "transporte"],
            "en": ["shipping", "time", "delivery", "delay", "arrival", "dispatch", "transport"]
        },
        "user_inputs": {
            "es": ["¿Hacen envíos a provincia?", "¿Cuánto tarda en llegar el pedido?", "¿Cuál es el tiempo de entrega?"],
            "en": ["Do you ship internationally?", "How long does delivery take?", "When will my order arrive?"]
        },
        "answer": {
            "es": "Sí, realizamos envíos. Los tiempos de entrega exactos se conversan con el asesor al momento de tu compra para ajustarnos a tu ubicación y urgencia.",
            "en": "Yes, we do ship. Exact delivery times are discussed with the advisor at the time of your purchase to adjust to your location and urgency."
        }
    },
    {
        "id": "soporte_tecnico",
        "isQuick": true,
        "showContact": true,
        "keywords": {
            "es": ["soporte", "técnico", "falla", "arreglo", "mantenimiento", "ayuda", "reparacion", "problema"],
            "en": ["support", "technical", "failure", "repair", "maintenance", "help", "issue"]
        },
        "user_inputs": {
            "es": ["Mi equipo no funciona, ¿qué hago?", "¿Tienen servicio de mantenimiento?", "¿A quién llamo si hay una falla técnica?"],
            "en": ["My equipment is failing, what should I do?", "Do you offer maintenance services?", "Who do I contact for technical issues?"]
        },
        "answer": {
            "es": "El soporte técnico se coordina directamente con un asesor especializado vía WhatsApp para brindarte una solución rápida.",
            "en": "Technical support is coordinated directly with a specialized advisor via WhatsApp to provide you with a quick solution."
        }
    },
    {
        "id": "especies_evaluadas",
        "isQuick": true,
        "showContact": false,
        "keywords": {
            "es": ["animales", "especies", "alpacas", "llamas", "vicuñas", "ovej", "conejo", "fibra"],
            "en": ["animals", "species", "alpacas", "llamas", "vicuñas", "sheep", "rabbit", "fiber"]
        },
        "user_inputs": {
            "es": ["¿Qué animales puedo analizar?", "¿Sirve para fibra de oveja?", "¿En qué especies funciona el equipo?"],
            "en": ["Which animals can I analyze?", "Does it work for sheep fiber?", "What species does the equipment support?"]
        },
        "answer": {
            "es": "Nuestros sistemas evalúan principalmente alpacas, llamas y vicuñas. También funcionan con ovinos (ovejas), caprinos, conejos y otros animales de fibra.",
            "en": "Our systems primarily evaluate alpacas, llamas, and vicuñas. They also work with sheep, goats, rabbits, and other fiber-producing animals."
        }
    },
    {
        "id": "confiabilidad_cientifica",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["confiabilidad", "científica", "precisión", "exactitud", "investigación", "validez", "certificado"],
            "en": ["reliability", "scientific", "precision", "accuracy", "research", "validity", "certified"]
        },
        "user_inputs": {
            "es": ["¿Son exactos los resultados?", "¿Qué tan precisas son las mediciones?", "¿Tienen validación científica?"],
            "en": ["Are the results accurate?", "How precise are the measurements?", "Do you have scientific validation?"]
        },
        "answer": {
            "es": "Sí, usamos Inteligencia Artificial validada científicamente con una precisión muy alta (r > 0.96). Nuestros equipos son usados en investigaciones y universidades internacionales.",
            "en": "Yes, we use scientifically validated Artificial Intelligence with very high precision (r > 0.96). Our equipment is used in international research and universities."
        }
    },
    {
        "id": "medicion_longitud",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["longitud", "medida", "largo", "tamaño", "extensión", "diametro", "finura", "micron"],
            "en": ["length", "measure", "long", "size", "extension", "diameter", "fineness", "micron"]
        },
        "user_inputs": {
            "es": ["¿El equipo puede medir el largo de la fibra?", "¿Calculan la longitud del vellón?", "¿Miden el tamaño de la mecha?"],
            "en": ["Can the equipment measure fiber length?", "Do you calculate fleece length?", "Is strand size measured?"]
        },
        "answer": {
            "es": "Nuestros equipos actuales (FIBER EC, FIBER MED, FIBER MULT) se especializan en finura (diámetro), medulación y características transversales. Para detalles sobre longitud, consulta con un asesor.",
            "en": "Our current equipment (FIBER EC, FIBER MED, FIBER MULT) specializes in fineness (diameter), medullation, and cross-sectional characteristics. For details on length, consult with an advisor."
        }
    },
    {
        "id": "condiciones_trabajo",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["condiciones", "extremo", "altitud", "temperatura", "clima", "altura", "frio", "campo"],
            "en": ["conditions", "extreme", "altitude", "temperature", "climate", "weather", "cold", "field"]
        },
        "user_inputs": {
            "es": ["¿Puedo usarlo en la puna o zonas altas?", "¿Funciona con clima muy frío?", "¿Resiste condiciones extremas?"],
            "en": ["Can I use it in high altitude areas?", "Does it work in very cold weather?", "Can it withstand extreme conditions?"]
        },
        "answer": {
            "es": "Sí, nuestros equipos están diseñados para trabajar en campo hasta los 5,300 metros sobre el nivel del mar y en temperaturas de 0°C a 45°C.",
            "en": "Yes, our equipment is designed to work in the field up to 5,300 meters above sea level and in temperatures from 0°C to 45°C."
        }
    },
    {
        "id": "garantia_productos",
        "isQuick": true,
        "showContact": false,
        "keywords": {
            "es": ["garantía", "asegurar", "inversión", "cobertura", "protección", "respaldo", "año"],
            "en": ["warranty", "secure", "investment", "coverage", "protection", "backing", "year"]
        },
        "user_inputs": {
            "es": ["¿Cuánto tiempo de garantía dan?", "¿Los equipos están garantizados?", "¿Qué pasa si viene con defectos de fábrica?"],
            "en": ["How long is the warranty?", "Are the devices guaranteed?", "What happens if there is a manufacturing defect?"]
        },
        "answer": {
            "es": "Sí, equipos principales como el FIBER EC y FIBER MED cuentan con una garantía de 1 año (12 meses) para asegurar tu inversión.",
            "en": "Yes, main equipment such as FIBER EC and FIBER MED have a 1-year (12-month) warranty to secure your investment."
        }
    },
    {
        "id": "que_es_fiberstech",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["quiénes", "empresa", "tecnológica", "dedican", "concytec", "nosotros", "historia"],
            "en": ["who", "company", "technological", "dedicate", "concytec", "us", "history"]
        },
        "user_inputs": {
            "es": ["¿A qué se dedica su empresa?", "¿Quiénes son ustedes?", "¿Cuál es el rubro de Fiberstech?"],
            "en": ["What does your company do?", "Who are you?", "What is Fiberstech's line of business?"]
        },
        "answer": {
            "es": "Somos una empresa tecnológica peruana y centro de investigación autorizado por CONCYTEC. Nos dedicamos a innovar para mejorar la producción y el bienestar animal.",
            "en": "We are a Peruvian technology company and a research center authorized by CONCYTEC. We are dedicated to innovating to improve animal production and welfare."
        }
    },
    {
        "id": "otros_servicios",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["servicios", "asesoría", "cursos", "consultoría", "tesis", "capacitacion", "analisis", "laboratorio"],
            "en": ["services", "advisory", "courses", "consultancy", "thesis", "training", "analysis", "lab"]
        },
        "user_inputs": {
            "es": ["¿Dan cursos o capacitaciones?", "¿Hacen análisis de muestras sin comprar el equipo?", "¿Ayudan con proyectos de tesis?"],
            "en": ["Do you provide training courses?", "Do you analyze samples without buying the device?", "Do you help with thesis projects?"]
        },
        "answer": {
            "es": "Sí, brindamos servicios de análisis de fibras, asesoría para tesis, cursos de tecnología textil y consultoría en proyectos de investigación.",
            "en": "Yes, we provide fiber analysis services, thesis advisory, textile technology courses, and consultancy in research projects."
        }
    },
    {
        "id": "productos_portatiles_campo",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["portátiles", "campo", "mochila", "ligeros", "altitud"],
            "en": ["portable", "field", "backpack", "lightweight", "altitude"]
        },
        "user_inputs": {
            "es": [
                "¿Qué equipos portátiles tienen para trabajo de campo?",
                "¿Tienen dispositivos ligeros para llevar a la granja?",
                "¿Cuáles equipos se pueden usar en altitud extrema?"
            ],
            "en": [
                "What portable equipment do you have for field work?",
                "Do you have lightweight devices to take to the farm?",
                "Which equipment can be used at extreme altitudes?"
            ]
        },
        "answer": {
            "es": "Contamos con equipos ultraportátiles ideales para el campo, como el S-FIBER EC (3.8 kg con mochila), el FIBER MED para medulación y el densímetro FIBER DEN de solo 200 gramos. Estos dispositivos soportan condiciones de hasta 5,300 m.s.n.m.",
            "en": "We have ultra-portable equipment ideal for the field, such as the S-FIBER EC (3.8 kg with backpack), the FIBER MED for medullation, and the FIBER DEN densimeter weighing only 200 grams. These devices withstand conditions up to 5,300 m.a.s.l."
        }
    },
    {
        "id": "productos_laboratorio_industrial",
        "isQuick": false,
        "showContact": true,
        "keywords": {
            "es": ["laboratorio", "pesados", "automatizados", "industrial", "faja"],
            "en": ["laboratory", "heavy", "automated", "industrial", "belt"]
        },
        "user_inputs": {
            "es": [
                "¿Tienen maquinaria industrial o para laboratorio?",
                "¿Qué equipos grandes ofrecen para analizar fibra?",
                "¿Tienen sistemas automatizados para evaluar vellones enteros?"
            ],
            "en": [
                "Do you have industrial or laboratory machinery?",
                "What large equipment do you offer to analyze fiber?",
                "Do you have automated systems to evaluate entire fleeces?"
            ]
        },
        "answer": {
            "es": "Sí, ofrecemos equipos automatizados de laboratorio como el FIBER TST para medir resistencia a la tracción. Para procesos industriales, contamos con el FIBER CLASS, un clasificador automatizado de 6.4 metros que evalúa porciones de vellón.",
            "en": "Yes, we offer automated laboratory equipment such as the FIBER TST to measure tensile strength. For industrial processes, we have the FIBER CLASS, a 6.4-meter automated classifier that evaluates fleece portions."
        }
    },
    {
        "id": "productos_medulacion_color",
        "isQuick": false,
        "showContact": false,
        "keywords": {
            "es": ["medulación", "colores", "oscuras", "blancas", "médula"],
            "en": ["medullation", "colors", "dark", "white", "medulla"]
        },
        "user_inputs": {
            "es": [
                "¿Qué equipo mide la medulación de la fibra?",
                "¿Tienen algo para analizar fibras de colores oscuros?",
                "¿Cómo evalúo el porcentaje de médula en alpacas?"
            ],
            "en": [
                "Which equipment measures fiber medullation?",
                "Do you have anything to analyze dark-colored fibers?",
                "How do I evaluate the medulla percentage in alpacas?"
            ]
        },
        "answer": {
            "es": "Para evaluar la medulación recomendamos el FIBER MED V2.0. Este equipo inteligente analiza fibras de diferentes colores (desde blancas hasta negras) y entrega resultados automáticos en 40 segundos.",
            "en": "To evaluate medullation we recommend the FIBER MED V2.0. This smart equipment analyzes fibers of different colors (from white to black) and delivers automatic results in 40 seconds."
        }
    },
    {
        "id": "productos_salud_animal",
        "isQuick": true,
        "showContact": false,
        "keywords": {
            "es": ["signos", "vitales", "ritmo", "cardíaco", "respiración"],
            "en": ["signs", "vital", "rhythm", "heart", "breathing"]
        },
        "user_inputs": {
            "es": [
                "¿Tienen equipos para medir la salud del animal?",
                "¿Venden monitores de ritmo cardíaco?",
                "¿Cómo mido la temperatura y respiración del ganado?"
            ],
            "en": [
                "Do you have equipment to measure animal health?",
                "Do you sell heart rate monitors?",
                "How do I measure the temperature and breathing of livestock?"
            ]
        },
        "answer": {
            "es": "Ofrecemos el MOSIVILLE, un equipo inalámbrico de 80 gramos. Este dispositivo monitorea en tiempo real el ritmo cardíaco, frecuencia respiratoria y temperatura de diversos animales directamente en tu smartphone.",
            "en": "We offer the MOSIVILLE, an 80-gram wireless device. This device monitors heart rate, respiratory rate, and temperature of various animals in real time directly on your smartphone."
        }
    }
];