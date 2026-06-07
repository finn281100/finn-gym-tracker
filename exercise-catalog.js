(function(global){
  'use strict';

  const CATEGORIES=['Alle','Brust','Rücken','Beine','Schultern','Arme','Bauch','Cardio'];
  const PRIMARY='#ff5a3f';
  const SECONDARY='#2f86e8';

  const EXERCISE_CATALOG=[
    {
      id:'dumbbell-biceps-curl',
      name:'Kurzhantel Bizepscurls',
      category:'Arme',
      equipment:'Kurzhanteln',
      mainMuscles:['Bizeps'],
      secondaryMuscles:['Unterarme','Vordere Schulter'],
      type:'Isolation',
      difficulty:'Anfänger',
      movement:'curl',
      pose:'standing',
      imageMuscles:{primary:['biceps'],secondary:['forearms','frontShoulders']},
      start:'Stehe aufrecht mit den Füßen hüftbreit. Halte in jeder Hand eine Kurzhantel mit gestreckten Armen und den Handflächen nach vorne.',
      end:'Beuge die Ellenbogen kontrolliert und führe die Hanteln nach oben, bis der Bizeps maximal angespannt ist. Die Oberarme bleiben stabil am Körper.',
      tips:['Schwinge den Oberkörper nicht mit.','Senke die Hanteln langsam ab.','Wähle ein Gewicht, mit dem die letzte Wiederholung sauber bleibt.']
    },
    {
      id:'goblet-squat',
      name:'Kettlebell Goblet Squat',
      category:'Beine',
      equipment:'Kettlebell',
      mainMuscles:['Quadrizeps','Gesäß'],
      secondaryMuscles:['Bauch','Rückenstrecker'],
      type:'Grundübung',
      difficulty:'Anfänger',
      movement:'squat',
      pose:'standing',
      imageMuscles:{primary:['quads','glutes'],secondary:['abs','lowerBack']},
      start:'Halte die Kettlebell vor der Brust. Die Füße stehen etwa schulterbreit, die Zehen zeigen leicht nach außen und der Oberkörper bleibt aufrecht.',
      end:'Senke die Hüfte kontrolliert nach unten, bis die Oberschenkel mindestens parallel zum Boden sind. Drücke dich über den ganzen Fuß wieder nach oben.',
      tips:['Knie folgen der Richtung der Zehen.','Halte die Kettlebell nah am Körper.','Der Rücken bleibt neutral.']
    },
    {
      id:'dumbbell-bench-press',
      name:'Kurzhantel Bankdrücken',
      category:'Brust',
      equipment:'Kurzhanteln, Bank',
      mainMuscles:['Brust'],
      secondaryMuscles:['Trizeps','Vordere Schulter'],
      type:'Grundübung',
      difficulty:'Anfänger',
      movement:'press',
      pose:'bench',
      imageMuscles:{primary:['chest'],secondary:['triceps','frontShoulders']},
      start:'Lege dich stabil auf die Bank. Die Schulterblätter sind leicht zusammengezogen, die Füße stehen fest am Boden und die Hanteln befinden sich neben der Brust.',
      end:'Drücke die Hanteln nach oben, bis die Arme fast gestreckt sind. Führe sie anschließend kontrolliert zurück, ohne die Schultern nach vorne fallen zu lassen.',
      tips:['Handgelenke bleiben über den Ellenbogen.','Kein starkes Hohlkreuz erzwingen.','Die Hanteln bewegen sich gleichmäßig.']
    },
    {
      id:'one-arm-dumbbell-row',
      name:'Einarmiges Kurzhantelrudern',
      category:'Rücken',
      equipment:'Kurzhantel, Bank',
      mainMuscles:['Latissimus','Oberer Rücken'],
      secondaryMuscles:['Bizeps','Hintere Schulter'],
      type:'Grundübung',
      difficulty:'Anfänger',
      movement:'row',
      pose:'hinge',
      imageMuscles:{primary:['lats','upperBack'],secondary:['biceps','rearShoulders']},
      start:'Stütze eine Hand und ein Knie auf der Bank ab. Der Rücken bleibt lang, die freie Hand hält die Kurzhantel unter der Schulter.',
      end:'Ziehe die Hantel Richtung Hüfte, bis der Ellenbogen knapp hinter dem Oberkörper ist. Senke sie kontrolliert ab, ohne die Schulter hängen zu lassen.',
      tips:['Ziehe aus dem Rücken, nicht nur aus dem Arm.','Der Oberkörper bleibt ruhig.','Blick leicht nach unten.']
    },
    {
      id:'dumbbell-shoulder-press',
      name:'Kurzhantel Schulterdrücken',
      category:'Schultern',
      equipment:'Kurzhanteln',
      mainMuscles:['Schultern'],
      secondaryMuscles:['Trizeps','Oberer Rücken'],
      type:'Grundübung',
      difficulty:'Anfänger',
      movement:'overhead',
      pose:'standing',
      imageMuscles:{primary:['frontShoulders','sideShoulders'],secondary:['triceps','upperBack']},
      start:'Halte die Hanteln auf Schulterhöhe. Bauch und Gesäß sind leicht angespannt, die Rippen bleiben unten.',
      end:'Drücke die Hanteln über den Kopf, bis die Arme fast gestreckt sind. Führe sie langsam zurück auf Schulterhöhe.',
      tips:['Vermeide ein starkes Zurücklehnen.','Die Hanteln bleiben über den Unterarmen.','Bewege beide Seiten gleichmäßig.']
    },
    {
      id:'dumbbell-lateral-raise',
      name:'Seitheben mit Kurzhanteln',
      category:'Schultern',
      equipment:'Kurzhanteln',
      mainMuscles:['Seitliche Schulter'],
      secondaryMuscles:['Nacken','Vordere Schulter'],
      type:'Isolation',
      difficulty:'Anfänger',
      movement:'lateral',
      pose:'standing',
      imageMuscles:{primary:['sideShoulders'],secondary:['traps','frontShoulders']},
      start:'Stehe aufrecht mit leicht gebeugten Armen. Die Hanteln hängen neben dem Körper, die Schultern bleiben tief.',
      end:'Hebe die Arme seitlich bis etwa Schulterhöhe. Senke die Hanteln langsam ab und halte die Spannung in den Schultern.',
      tips:['Nicht mit Schwung arbeiten.','Ellenbogen führen die Bewegung.','Leichte Gewichte reichen oft aus.']
    },
    {
      id:'dumbbell-romanian-deadlift',
      name:'Kurzhantel Romanian Deadlift',
      category:'Beine',
      equipment:'Kurzhanteln',
      mainMuscles:['Beinbeuger','Gesäß'],
      secondaryMuscles:['Rückenstrecker','Unterarme'],
      type:'Grundübung',
      difficulty:'Mittel',
      movement:'hinge',
      pose:'hinge',
      imageMuscles:{primary:['hamstrings','glutes'],secondary:['lowerBack','forearms']},
      start:'Stehe hüftbreit und halte die Hanteln vor den Oberschenkeln. Die Knie sind leicht gebeugt, der Rücken bleibt neutral.',
      end:'Schiebe die Hüfte nach hinten und senke die Hanteln nah an den Beinen ab. Kehre über Gesäß und Beinbeuger kontrolliert zurück.',
      tips:['Die Bewegung kommt aus der Hüfte.','Hanteln bleiben nah am Körper.','Nur so tief gehen, wie der Rücken neutral bleibt.']
    },
    {
      id:'kettlebell-swing',
      name:'Kettlebell Swing',
      category:'Cardio',
      equipment:'Kettlebell',
      mainMuscles:['Gesäß','Beinbeuger'],
      secondaryMuscles:['Bauch','Schultern','Rückenstrecker'],
      type:'Freie Übung',
      difficulty:'Mittel',
      movement:'swing',
      pose:'hinge',
      imageMuscles:{primary:['glutes','hamstrings'],secondary:['abs','frontShoulders','lowerBack']},
      start:'Stelle dich etwas breiter als hüftbreit hin. Die Kettlebell startet vor dem Körper, der Rücken bleibt lang und die Hüfte geht nach hinten.',
      end:'Strecke die Hüfte explosiv und lasse die Kettlebell bis etwa Brusthöhe schwingen. Die Arme führen nur, die Kraft kommt aus der Hüfte.',
      tips:['Kein Frontheben aus den Schultern.','Spanne Bauch und Gesäß oben kurz an.','Lerne die Hüftbewegung zuerst langsam.']
    },
    {
      id:'plank',
      name:'Unterarmstütz',
      category:'Bauch',
      equipment:'Körpergewicht',
      mainMuscles:['Bauch'],
      secondaryMuscles:['Gesäß','Schultern'],
      type:'Stabilität',
      difficulty:'Anfänger',
      movement:'plank',
      pose:'floor',
      imageMuscles:{primary:['abs'],secondary:['glutes','frontShoulders']},
      start:'Platziere die Unterarme unter den Schultern. Die Beine sind gestreckt, der Körper bildet eine gerade Linie.',
      end:'Halte die Position aktiv. Ziehe den Bauchnabel leicht nach innen, spanne das Gesäß an und vermeide ein Durchhängen der Hüfte.',
      tips:['Atme ruhig weiter.','Kopf bleibt in Verlängerung der Wirbelsäule.','Qualität geht vor Haltedauer.']
    },
    {
      id:'jump-rope',
      name:'Seilspringen',
      category:'Cardio',
      equipment:'Springseil',
      mainMuscles:['Waden'],
      secondaryMuscles:['Schultern','Unterarme','Bauch'],
      type:'Cardio',
      difficulty:'Anfänger',
      movement:'jump',
      pose:'standing',
      imageMuscles:{primary:['calves'],secondary:['frontShoulders','forearms','abs']},
      start:'Stehe aufrecht mit leicht gebeugten Knien. Die Ellenbogen bleiben nah am Körper und das Seil liegt hinter den Fersen.',
      end:'Springe flach über das Seil und drehe es locker aus den Handgelenken. Lande leise auf dem Vorfuß.',
      tips:['Springe nur wenige Zentimeter hoch.','Bleibe rhythmisch und locker.','Starte mit kurzen Intervallen.']
    }
  ];

  function normalizeCatalogQuery(value){
    return String(value||'').trim().toLowerCase();
  }

  function filterExerciseCatalog(catalog,{category='Alle',query=''}={}){
    const q=normalizeCatalogQuery(query);
    return (catalog||[]).filter(ex=>{
      const categoryMatch=!category||category==='Alle'||ex.category===category;
      const haystack=[ex.name,ex.category,ex.equipment,ex.type,ex.difficulty,...ex.mainMuscles,...ex.secondaryMuscles].join(' ').toLowerCase();
      return categoryMatch&&(!q||haystack.includes(q));
    });
  }

  function validateExerciseCatalog(catalog){
    const ids=new Set(),errors=[];
    (catalog||[]).forEach((ex,index)=>{
      ['id','name','category','equipment','type','difficulty','movement','pose','start','end'].forEach(field=>{if(!ex[field])errors.push(`Eintrag ${index+1}: ${field} fehlt.`);});
      if(ids.has(ex.id))errors.push(`Doppelte ID: ${ex.id}`);
      ids.add(ex.id);
      if(!CATEGORIES.includes(ex.category))errors.push(`${ex.name}: unbekannte Kategorie ${ex.category}`);
      if(!Array.isArray(ex.mainMuscles)||!ex.mainMuscles.length)errors.push(`${ex.name}: Hauptmuskel fehlt.`);
      if(!Array.isArray(ex.secondaryMuscles))errors.push(`${ex.name}: sekundäre Muskeln fehlen.`);
      if(!ex.imageMuscles||!Array.isArray(ex.imageMuscles.primary))errors.push(`${ex.name}: Muskel-Highlight fehlt.`);
    });
    return errors;
  }

  function esc(value){
    return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function equipmentSvg(ex,phase){
    const lift=phase==='end';
    if(/Kettlebell/.test(ex.equipment)){
      const y=lift?63:112;
      return `<path d="M86 ${y}a14 14 0 1 0 28 0 14 14 0 0 0-28 0Z" fill="#262b31" stroke="#111"/><path d="M92 ${y-8}c2-15 14-15 16 0" fill="none" stroke="#111" stroke-width="5"/>`;
    }
    if(/Springseil/.test(ex.equipment)){
      return `<path d="M42 88c-24 30-18 72 58 72s82-42 58-72" fill="none" stroke="#2f86e8" stroke-width="3" opacity=".8"/>`;
    }
    if(/Körpergewicht/.test(ex.equipment))return '';
    const y=lift?58:112;
    return `<g fill="#20252b" stroke="#0d1014"><circle cx="58" cy="${y}" r="9"/><circle cx="142" cy="${y}" r="9"/><rect x="62" y="${y-3}" width="22" height="6" rx="3"/><rect x="116" y="${y-3}" width="22" height="6" rx="3"/></g>`;
  }

  function poseSvg(ex,phase){
    const lift=phase==='end';
    const bend=(ex.movement==='squat'&&lift)||(['hinge','swing','row'].includes(ex.movement)&&lift);
    const floor=ex.pose==='floor';
    if(ex.pose==='bench'){
      const armY=lift?54:84;
      return `<rect x="32" y="126" width="136" height="12" rx="5" fill="#343b44"/><path d="M48 138v24M152 138v24" stroke="#20252b" stroke-width="7" stroke-linecap="round"/><g stroke="#8a5d40" stroke-width="9" stroke-linecap="round" fill="none"><path d="M70 101h60"/><path d="M78 100l-18 28"/><path d="M122 100l18 28"/><path d="M82 95l-20 ${armY-95}"/><path d="M118 95l20 ${armY-95}"/></g><path d="M70 88h62l-10 31H80z" fill="#d8b08d" stroke="#7a5238"/><circle cx="143" cy="84" r="14" fill="#d8b08d" stroke="#7a5238"/><path d="M132 78c8-10 20-8 25 0-8-4-16-4-25 0Z" fill="#222"/>${equipmentSvg(ex,phase)}`;
    }
    if(floor){
      return `<g stroke="#202833" stroke-width="10" stroke-linecap="round" fill="none"><path d="M58 118h82"/><path d="M74 118l-18 28"/><path d="M126 118l22 28"/><path d="M94 91l-20 27"/><path d="M94 91l36 27"/></g><circle cx="100" cy="78" r="16" fill="#d8b08d" stroke="#7a5238"/><path d="M80 94h40l24 24H56z" fill="#d8b08d" stroke="#7a5238"/>`;
    }
    const torsoY=bend?80:70, hipY=bend?113:112, kneeY=bend?142:148;
    const armEndY=lift?58:112;
    return `<g stroke="#8a5d40" stroke-width="9" stroke-linecap="round" fill="none"><path d="M100 ${torsoY}v38"/><path d="M82 ${torsoY+12}l-24 ${armEndY-torsoY-12}"/><path d="M118 ${torsoY+12}l24 ${armEndY-torsoY-12}"/><path d="M90 ${hipY}l-18 ${kneeY-hipY}l-8 28"/><path d="M110 ${hipY}l18 ${kneeY-hipY}l8 28"/></g><path d="M78 ${torsoY}c8-18 36-18 44 0l-10 42H88z" fill="#d8b08d" stroke="#7a5238"/><circle cx="100" cy="46" r="16" fill="#d8b08d" stroke="#7a5238"/><path d="M87 38c6-13 27-11 31 0-9-5-19-6-31 0Z" fill="#222"/>${equipmentSvg(ex,phase)}`;
  }

  function renderCatalogPoseSvg(ex,phase){
    const title=phase==='start'?'Start-Position':'End-Position';
    return `<svg class="catalog-figure" viewBox="0 0 200 190" role="img" aria-label="${esc(ex.name)} ${esc(title)}"><defs><linearGradient id="skin-${esc(ex.id)}-${phase}" x1="0" x2="1"><stop stop-color="#f1c7a0"/><stop offset="1" stop-color="#b87952"/></linearGradient></defs><rect width="200" height="190" rx="10" fill="#f6f7f9"/><ellipse cx="100" cy="176" rx="58" ry="8" fill="#d7dce2"/><g>${poseSvg(ex,phase)}</g></svg>`;
  }

  const muscleShape={
    chest:'M78 65h44v24H78z',abs:'M88 90h24v40H88z',biceps:'M58 72h16v38H58z M126 72h16v38h-16z',triceps:'M54 82h14v32H54z M132 82h14v32h-14z',
    forearms:'M47 107h14v35H47z M139 107h14v35h-14z',frontShoulders:'M60 57h22v18H60z M118 57h22v18h-22z',sideShoulders:'M54 58h24v19H54z M122 58h24v19h-24z',
    rearShoulders:'M61 58h24v18H61z M115 58h24v18h-24z',traps:'M82 46h36v18H82z',lats:'M67 76h24v48H67z M109 76h24v48h-24z',
    upperBack:'M75 58h50v38H75z',lowerBack:'M82 101h36v33H82z',quads:'M72 123h22v45H72z M106 123h22v45h-22z',hamstrings:'M72 125h22v45H72z M106 125h22v45h-22z',
    glutes:'M73 108h54v28H73z',calves:'M70 158h18v25H70z M112 158h18v25h-18z'
  };

  function renderMuscleLayer(keys,color){
    return (keys||[]).map(key=>muscleShape[key]?`<path d="${muscleShape[key]}" fill="${color}" opacity=".88"/>`:'').join('');
  }

  function renderCatalogMuscleSvg(ex){
    const p=ex.imageMuscles||{primary:[],secondary:[]};
    return `<svg class="muscle-map" viewBox="0 0 200 190" role="img" aria-label="Beanspruchte Muskeln: ${esc(ex.mainMuscles.join(', '))}"><rect width="200" height="190" rx="10" fill="#0b1623"/><g opacity=".75" stroke="#8e9bad" stroke-width="2" fill="none" stroke-linecap="round"><circle cx="100" cy="34" r="14"/><path d="M100 48v96M75 62h50M78 62l-28 54M122 62l28 54M82 102l-15 72M118 102l15 72M82 88h36M69 174h20M111 174h20"/></g>${renderMuscleLayer(p.secondary,SECONDARY)}${renderMuscleLayer(p.primary,PRIMARY)}<g fill="#d7deea" font-size="12"><circle cx="62" cy="178" r="5" fill="${PRIMARY}"/><text x="72" y="182">Primär</text><circle cx="124" cy="178" r="5" fill="${SECONDARY}"/><text x="134" y="182">Sekundär</text></g></svg>`;
  }

  function renderCatalogExerciseCard(ex){
    return `<article class="catalog-entry"><div class="catalog-main"><h2>${esc(ex.name)}</h2><div class="catalog-category">${esc(ex.category)}</div><div class="catalog-meta"><span>🏋 ${esc(ex.equipment)}</span><span>▥ ${esc(ex.type)}</span><span>▥ ${esc(ex.difficulty)}</span></div><div class="catalog-steps"><div class="catalog-step"><strong>START-POSITION</strong>${renderCatalogPoseSvg(ex,'start')}<p>${esc(ex.start)}</p></div><div class="catalog-step"><strong>END-POSITION</strong>${renderCatalogPoseSvg(ex,'end')}<p>${esc(ex.end)}</p></div></div></div><aside class="catalog-side"><div class="catalog-box"><h3>Beanspruchte Muskeln</h3>${renderCatalogMuscleSvg(ex)}</div><div class="catalog-box"><h3>Übung Details</h3><div class="catalog-detail-row"><span>Equipment</span><strong>${esc(ex.equipment)}</strong></div><div class="catalog-detail-row"><span>Hauptmuskel</span><strong>${esc(ex.mainMuscles.join(', '))}</strong></div><div class="catalog-detail-row"><span>Übungsart</span><strong>${esc(ex.type)}</strong></div><div class="catalog-detail-row"><span>Schwierigkeit</span><strong>${esc(ex.difficulty)}</strong></div></div><div class="catalog-box"><h3>Tipps</h3><ul>${(ex.tips||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div></aside></article>`;
  }

  function renderExerciseCatalog(catalog,filters){
    const rows=filterExerciseCatalog(catalog,filters);
    return rows.length?rows.map(renderCatalogExerciseCard).join(''):'<div class="chart-box"><p class="sub">Keine passende Übung gefunden.</p></div>';
  }

  global.GYM_EXERCISE_CATALOG_API={CATEGORIES,EXERCISE_CATALOG,filterExerciseCatalog,normalizeCatalogQuery,validateExerciseCatalog,renderCatalogPoseSvg,renderCatalogMuscleSvg,renderExerciseCatalog};
})(typeof window!=='undefined'?window:globalThis);
