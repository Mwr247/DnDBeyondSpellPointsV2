// ==UserScript==
// @name         DnDBeyond Spell Points (v2)
// @description  Spell point tracker
// @version      2
// @author       Mwr247
// @namespace    Mwr247
// @homepageURL  https://github.com/Mwr247/DnDBeyondSpellPointsV2
// @include      https://www.dndbeyond.com/*characters/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const sp = [
    // Class Level, Sorc Points, Spell Points, Max Slot Level
    [1,0,4,1],
    [2,2,6,1],
    [3,3,14,2],
    [4,4,17,2],
    [5,5,27,3],
    [6,6,32,3],
    [7,7,38,4],
    [8,8,44,4],
    [9,9,57,5],
    [10,10,64,5],
    [11,11,73,6],
    [12,12,73,6],
    [13,13,83,7],
    [14,14,83,7],
    [15,15,94,8],
    [16,16,94,8],
    [17,17,107,9],
    [18,18,114,9],
    [19,19,123,9],
    [20,20,133,9]
  ];
  const sc = [
    // Spell Level, Point Cost, Limit of 1
    [1,2,false],
    [2,3,false],
    [3,5,false],
    [4,6,false],
    [5,7,false],
    [6,8,true],
    [7,10,true],
    [8,11,true],
    [9,13,true]
  ];
  const player = {
    id: location.pathname.split('/characters/')[1].split('/')[0],
    level: null,
    points: 0,
    maxPoints: 0,
    maxSpellLevel: 0,
    data: null
  };
  let loaded = 10;
  let spSystem = null;
  let useSpellPoints = null;
  let mergeSorcPoints = null;
  let token = null;
  let tokenExpires = 0;
  const getToken = cb => {
    console.log('refreshing token');
    fetch('https://auth-service.dndbeyond.com/v1/cobalt-token', {
      method: 'POST',
      credentials: 'include'
    }).then(resp => resp.json()).then(data => {
      console.log('token updated');
      token = data.token;
      tokenExpires = Date.now() + data.ttl * 1000 - 10000;
      cb();
    }).catch(error => console.error(error));
  };
  const getData = (path='', obj={}, cb=()=>{}) => {
    console.log('loading data');
    const dataCall = (path, obj, cb) => () => {
      console.log('data call to', path);
      obj.headers = Object.assign(obj.headers || {}, {'Content-type': 'application/json;charset=utf-8', 'Authorization': 'Bearer ' + token});
      if (obj.body) {obj.body = JSON.stringify(obj.body);}
      fetch('https://character-service.dndbeyond.com/character/v4/' + path, obj).then(resp => resp.json()).then(data => {
        cb(data.data);
      }).catch(error => console.error(error));
    };
    if (token == null || tokenExpires <= Date.now()) {
      getToken(dataCall(path, obj, cb));
    } else {
      dataCall(path, obj, cb)();
    }
  };
  setTimeout(() => {
    getData('character/' + player.id, {}, data => {
      player.data = data;
      spSystem = (player.data?.customActions || []).find(act => act.name === 'Spell Points');
      useSpellPoints = spSystem?.isProficient === true;
      mergeSorcPoints = spSystem?.isMartialArts === true;
			const classes = data.classes.map(cl => {
        const isCaster = (cl.definition.canCastSpells == true || cl.subclassDefinition?.canCastSpells == true) && cl.definition.id !== 7;
				const level = cl.level || 1;
        const divisor = cl.definition.spellRules?.multiClassSpellSlotDivisor || cl.subclassDefinition?.spellRules?.multiClassSpellSlotDivisor || 1;
				const rounder = cl.definition.spellRules?.multiClassSpellSlotRounding || cl.subclassDefinition?.spellRules?.multiClassSpellSlotRounding || 1;
        return isCaster * Math[rounder === 1 ? 'floor' : 'ceil'](level / divisor);
      });
      player.level = classes.reduce((a, b) => a + b, 0) || 1;
    	const sorcPoints = ((player.data?.actions?.class || []).find(act => act?.id === '1031') || {}).limitedUse?.maxUses || 0;
      player.maxPoints = sorcPoints * mergeSorcPoints + sp[player.level - 1][2];
    });
  }, 100);
  const init = () => {
    const content = document.getElementById('character-tools-target');
    if (!content) {return;}
    const sheet = [...content.getElementsByClassName('ct-character-header-desktop')].length;
    if (sheet) {
      if (!useSpellPoints) {return;}
      console.log('Spell point tracker active');
      player.points = Math.max(player.maxPoints - (spSystem?.fixedValue || 0) * 1, 0);
      player.maxSpellLevel = sp[player.level - 1][3];
      const setPoints = val => {
        val = Math.max(Math.min(val, player.maxPoints), 0);
        player.points = val;
        const tmp = Object.assign(spSystem, {characterId: +player.id, fixedValue: (player.maxPoints - val) || null});
        getData('custom/action', {method: 'PUT', body: tmp}, data => {
          console.log('updated spell point action');
          spSystem.fixedValue = tmp.fixedValue;
        });
        (document.getElementById('pointsDisplay') || {}).innerText = player.points + ' / ' + player.maxPoints;
      };
      const cast = level => {
        const cost = sc[level - 1][1];
        return evt => {
          if (player.points >= cost){
            setPoints(player.points - cost);
            console.log('cast level', level, 'spell with', cost, 'points');
          } else {
            alert('Insufficient spell points');
          }
          if (!sc[level - 1][2]) {evt.stopPropagation();}
        };
      };
      const castClick = evt => {
        console.log('checking levels');
        setTimeout(() => {
          [...content.getElementsByClassName('ct-content-group')].forEach(el => {
            if (!/^CANTRIP/.test(el.innerText)) {
              const level = +el.innerText[0];
              console.log('level', level);
              const lvl = el.querySelector('.ct-content-group__header-content');
              if (!lvl.spFlag){
                lvl.spFlag = true;
                lvl.innerText += ' (Cost ' + sc[level - 1][1] + ')';
              }
              [...el.getElementsByClassName('ddbc-button')].filter(ele => /CAST$/.test(ele.innerText) && !ele.evtFlag).forEach(ele => {
                ele.evtFlag = true;
                ele.addEventListener('click', cast(level));
              });
              [...el.getElementsByClassName('ct-spells-spell')].filter(ele => !ele.evtFlag).forEach(ele => {
                ele.evtFlag = true;
                ele.addEventListener('click', panelOpenClick);
              });
            }
          });
        }, 10);
      };
      const actionCastClick = evt => {
        console.log('checking actions');
        setTimeout(() => {
          [...content.getElementsByClassName('ddbc-combat-attack--spell')].filter(ele => !ele.evtFlag).forEach(ele => {
            ele.evtFlag = true;
            ele.addEventListener('click', panelOpenClick);
          });
        }, 10);
      };
      const panelOpenClick = evt => {
          console.log('opened panel');
          setTimeout(() => {
            const spDetail = document.getElementsByClassName('ct-spell-detail')[0];
            if (spDetail != null) {
              const spCast = spDetail.querySelector('.ct-spell-caster__casting-action > button');
              spCast.innerHTML = spCast.innerHTML.replace('Spell Slot', 'Spell Points');
              const spLvl = spDetail.getElementsByClassName('ct-spell-caster__casting-level-current')[0];
              const spCost = spDetail.getElementsByClassName('ct-spell-caster__casting-action-count--spellcasting')[0];
              console.log('spell level:', spLvl.innerText[0]);
              spCast.spLvl = spLvl.innerText[0];
              spCost.innerText = sc[+spCast.spLvl - 1][1];
              spCast.addEventListener('click', evt => cast(+spCast.spLvl)(evt));
              [...spDetail.getElementsByClassName('ct-spell-caster__casting-level-action')].forEach(ele => {
                ele.addEventListener('click', evt => {
                  setTimeout(() => {
                    console.log('spell level:', spLvl.innerText[0]);
                    spCast.spLvl = spLvl.innerText[0];
                    spCost.innerText = sc[+spCast.spLvl - 1][1];
                  }, 10);
                });
              });
            }
          }, 50);
      };
      const actionClick = evt => {
        console.log('clicked actions');
        setTimeout(() => {
          [...content.querySelectorAll('.ct-actions__content .ddbc-tab-options__header')].forEach(ele => ele.addEventListener('click', actionCastClick));
          actionCastClick(evt);
        }, 50);
      };
      const spellClick = evt => {
        console.log('clicked spells');
        setTimeout(() => {
          let tmp = content.getElementsByClassName('ct-spells-level-casting__info-group')[2];
          let pdc = tmp.cloneNode(true);
          pdc.childNodes[1].innerText = 'Spell Points';
          pdc.childNodes[0].childNodes[0].innerText = '';
          let pdSub = document.createElement('span');
          pdSub.innerText = '–';
          pdSub.style.color = '#BB0000';
          pdSub.style.userSelect = 'none';
          pdSub.style.cursor = 'pointer';
          pdSub.addEventListener('click', evt => {
            setPoints(player.points - 1);
          });
          pdc.childNodes[0].childNodes[0].appendChild(pdSub);
          let pd = document.createElement('span');
          pd.innerText = player.points + ' / ' + player.maxPoints;
          pd.id = 'pointsDisplay';
          pd.style.margin = '0 4px';
          pd.style.cursor = 'pointer';
          pd.addEventListener('click', evt => {
            let val = prompt('Override Spell Points', player.points);
            if (val == null) {return;}
            else {val = +val;}
            if (val >= 0) {setPoints(val);}
            else {alert('Invalid point value');}
          });
          pdc.childNodes[0].childNodes[0].appendChild(pd);
          let pdAdd = document.createElement('span');
          pdAdd.innerText = '+';
          pdAdd.style.color = '#00BB00';
          pdAdd.style.userSelect = 'none';
          pdAdd.style.cursor = 'pointer';
          pdAdd.addEventListener('click', evt => {
            setPoints(player.points + 1);
          });
          pdc.childNodes[0].childNodes[0].appendChild(pdAdd);
          tmp.parentNode.appendChild(pdc);
          [...content.querySelectorAll('.ct-spells__content .ddbc-tab-options__header')].forEach(ele => ele.addEventListener('click', castClick));
          content.getElementsByClassName('ct-spells-filter__input')[0].addEventListener('input', castClick);
          castClick(evt);
        }, 50);
      };
      const rest = evt => {
        setPoints(player.maxPoints);
      };
      const restClick = evt => {
        setTimeout(() => {
          document.querySelector('.ct-reset-pane__action .ct-button--confirm').addEventListener('click', rest);
        }, 50);
      };
      content.getElementsByClassName('ct-primary-box__tab--spells')[0].addEventListener('click', spellClick);
      content.getElementsByClassName('ct-primary-box__tab--actions')[0].addEventListener('click', actionClick);
      actionClick();
      content.querySelector('.ct-character-header-desktop__group--long-rest .ct-character-header-desktop__button').addEventListener('click', restClick);
      loaded = 0;
    } else if (/\/builder/.test(window.location.pathname)) {
      const hashChange = evt => {
        if (/\/home\/basic/.test(window.location.pathname)) {
          setTimeout(() => {
            useSpellPoints = spSystem?.isProficient === true;
            mergeSorcPoints = spSystem?.isMartialArts === true;
            const opt = [...content.getElementsByClassName('builder-field builder-field-toggles')].find(ele => /Optional Features/.test(ele.innerText));
            const tmp = opt.getElementsByClassName('builder-field-toggles-field')[0];
            const useSp = tmp.cloneNode(true);
            useSp.childNodes[1].innerText = 'Use Spell Points (Variant Rule)';
            useSp.childNodes[0].childNodes[0].classList.remove('ddbc-toggle-field--is-enabled', 'ddbc-toggle-field--is-disabled');
            useSp.childNodes[0].childNodes[0].classList.add(useSpellPoints ? 'ddbc-toggle-field--is-enabled' : 'ddbc-toggle-field--is-disabled');
            useSp.childNodes[0].addEventListener('click', evt => {
              if (spSystem != null) {
        				const tmp = Object.assign(spSystem, {characterId: +player.id, isProficient: !spSystem.isProficient});
        				getData('custom/action', {method: 'PUT', body: tmp}, data => {
									console.log('updated spell point action');
                  spSystem.isProficient = tmp.isProficient;
                });
      				} else {
								getData('custom/action', {method: 'POST', body: {'characterId': +player.id, 'name': 'Spell Points', 'actionType': '3'}}, data => {
                  console.log('created spell point action');
                  (player.data?.customActions || []).push(data);
                  spSystem = (player.data?.customActions || []).find(act => act?.name === 'Spell Points');
                  const tmp = Object.assign(spSystem, {characterId: +player.id, isProficient: !spSystem.isProficient});
                  getData('custom/action', {method: 'PUT', body: tmp}, data => {
                    console.log('updated spell point action');
                    spSystem.isProficient = tmp.isProficient;
                  });
                });
              }
              useSpellPoints = !useSpellPoints;
              useSp.childNodes[0].childNodes[0].classList.remove('ddbc-toggle-field--is-enabled', 'ddbc-toggle-field--is-disabled');
              useSp.childNodes[0].childNodes[0].classList.add(useSpellPoints ? 'ddbc-toggle-field--is-enabled' : 'ddbc-toggle-field--is-disabled');
            });
            tmp.parentNode.appendChild(useSp);
            const mergeSp = tmp.cloneNode(true);
            mergeSp.childNodes[1].innerText = 'Combine Spell Points with Sorcery Points';
            mergeSp.childNodes[0].childNodes[0].classList.remove('ddbc-toggle-field--is-enabled', 'ddbc-toggle-field--is-disabled');
            mergeSp.childNodes[0].childNodes[0].classList.add(mergeSorcPoints ? 'ddbc-toggle-field--is-enabled' : 'ddbc-toggle-field--is-disabled');
            mergeSp.childNodes[0].addEventListener('click', evt => {
              if (spSystem != null) {
        				const tmp = Object.assign(spSystem, {characterId: +player.id, isMartialArts: !spSystem.isMartialArts});
        				getData('custom/action', {method: 'PUT', body: tmp}, data => {
									console.log('updated spell point action');
                  spSystem.isMartialArts = tmp.isMartialArts;
                });
      				} else {
								getData('custom/action', {method: 'POST', body: {'characterId': +player.id, 'name': 'Spell Points', 'actionType': '3'}}, data => {
                  console.log('created spell point action');
                  (player.data?.customActions || []).push(data);
                  spSystem = (player.data?.customActions || []).find(act => act?.name === 'Spell Points');
                  const tmp = Object.assign(spSystem, {characterId: +player.id, isMartialArts: !spSystem.isMartialArts});
                  getData('custom/action', {method: 'PUT', body: tmp}, data => {
                   	console.log('updated spell point action');
                   	spSystem.isMartialArts = tmp.isMartialArts;
                  });
                });
              }
              mergeSorcPoints = !mergeSorcPoints;
              mergeSp.childNodes[0].childNodes[0].classList.remove('ddbc-toggle-field--is-enabled', 'ddbc-toggle-field--is-disabled');
              mergeSp.childNodes[0].childNodes[0].classList.add(mergeSorcPoints ? 'ddbc-toggle-field--is-enabled' : 'ddbc-toggle-field--is-disabled');
            });
            tmp.parentNode.appendChild(mergeSp);
          }, 50);
        }
      };
      hashChange();
      loaded = 0;
    } else {
      if (loaded-- > 0) {
        console.log('attempting to load point tracker...');
        setTimeout(init, 1000);
      }else {
        console.log('point tracker failed to load');
      }
      return;
    }
    // console.log('player', player);
  };
  let initializer = null;
  let prevUrl = '';
  const obs = new MutationObserver(mut => {
    if (location.href !== prevUrl) {
      prevUrl = location.href;
      let delay = 1000;
      if (/\/builder/.test(window.location.pathname) && loaded === 0) {
        delay = 0;
      }
      clearTimeout(initializer);
      initializer = setTimeout(init, delay);
    }
  });
  obs.observe(document, {subtree: true, childList: true});
})();
