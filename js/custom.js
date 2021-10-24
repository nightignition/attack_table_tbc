/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits


******************************/

$(document).ready(function()
{
	"use strict";

	/* 

	1. Vars and Inits

	*/

	var 
	level = 70,
	targetLevel = 73,
	targetDefense = 0,
	skillDiff = 0,
	hitChance,
	crit = 0,
	weaponSkill = 0,
	extraWeaponSkill = 0,
	dw,
	attackFromBehind,
	defense = 365,
	miss = 0,
	dodge = 5,
	parry = 14,
	glance = 0,
	glanceRed = 0,
	block = 5,
	total = 100,
	hit = 100,
	expertise = 0,
	btn = $('.button'),
	table = $('.results');
	btn.on('click', calculate);

	initStatControl();
	initCheckboxes();
	calculate();

	function calculate()
	{
		resetDefaults();
		targetDefense = targetLevel * 5; //365 for level 73 mobs
		hitChance = $('#input_hit').text();
		weaponSkill = $('#wskill').text();
		expertise = $('#input_exp').text();
		skillDiff = targetDefense - weaponSkill;
		crit = parseInt($('#input_crit').text());
		if($('.check_2').hasClass("checked"))
		{
			dw = true;
		}
		else
		{
			dw = false;
		}

		// Check if attacking from behind
		if($('.check_1').hasClass('checked'))
		{
			attackFromBehind = true;
			parry = 0;
			block = 0;
		}
		else
		{
			attackFromBehind = false;
			parry = getParry();
		}

		miss = getMiss() - hitChance;
		miss = parseFloat(round(miss));
		if(miss < 0)
		{
			miss = 0;
		}
		var dodgeFinal = (dodge + (skillDiff * 0.1)) - (expertise * 0.25);

		// Get Glance Chance - GlanceChance = MAX(0, 6% + (TargetLevel*5 - AttackerSkill) * 1.2%)
		glance = Math.max(0, (6 + (((targetLevel * 5) - weaponSkill) * 1.2)));
		glanceRed = 100 - (getGlanceRed() * 100);

		total = total - miss - dodgeFinal - glance - parry - block;
		var critFinal = parseFloat(getCritFinal());
		var critOverCap = 0;
		total = round(total);

		// See if crit is overcapped
		if(parseFloat(critFinal) > parseFloat(total))
		{
			critOverCap = round(critFinal - total);
			critFinal = total;
		}

		critFinal = Math.min((100 - miss - dodgeFinal - parry - block - glance), critFinal);
		var hitFinal = round(Math.max((100 - miss - dodgeFinal - parry - block - glance - critFinal), 0));

		if(critOverCap > 0)
		{
			critFinal = critFinal + '(' + critOverCap + '% crit is over the cap)';
			hitFinal = 0;
		}
		
		parry = parry + "%";
		block = block + "%";
		var result = 
			'<div>Miss: '+ miss +'</div>'+
			'<div>Dodge: '+ dodgeFinal +'</div>'+
			'<div>Parry: '+ parry +'</div>'+
			'<div>Glancing Chance: '+ glance +'</div>'+
			'<div>Glancing Reduction: '+ glanceRed +'%</div>'+
			'<div>Block: '+ block +'</div>'+
			'<div>Crit: '+ critFinal +'</div>'+
			// '<div>Crit cap (white): '+ total +'</div>'+
			'<div>Hit: '+ hitFinal +'%</div>';
		table.children().remove();
		table.append(result);
	}

	function round(x)
	{
		var returnValue;

		returnValue = parseFloat(x.toString().substring(0, x.toString().indexOf(".") + 3));

		return returnValue;
	}

	function resetDefaults()
	{
		targetDefense = 0;
		crit = 0;
		weaponSkill = 0;
		skillDiff = 0;
		miss = 0;
		block = 5;
		parry = 14;
		glanceRed = 0;
		total = 100;
	}

	function getCritFinal()
	{
		var critTemp = (crit + ((level * 5 - (targetLevel * 5)) * 0.2)) - 1.8;

		// A flat 1.8% reduction to your crit chance gained from auras. Auras in this context are talents
		// such as Cruelty or Axe Specialization, gear that directly gives crit % through Equip: effects,
		// buffs that increase you crit chance like Songflower Serenade or Leader of the Pack, and
		// consumables such as Elixir of the Mongoose. It does not include crit gained indirectly through
		// Agility, neither base Agility or Agility from gear.
		// var critOverCap = 0;
		
		// if(parseFloat(critTemp) > parseFloat(total))
		// {
		// 	critOverCap = critTemp - total;
		// 	critTemp = total + '(' + critOverCap + '% crit is over the cap)';
		// }
		return critTemp;
	}

	function getMiss()
	{
		var returnValue;

		if(skillDiff < 11)
		{
			returnValue = 5 + ((targetLevel * 5) - weaponSkill) * 0.1;
		}
		else
		{
			returnValue = 5 + ((targetLevel * 5) - weaponSkill) * 0.2;
		}

		if(dw)
		{
			//DualWieldMissChance = NormalMissChance * 0.8 + 20%
			returnValue = returnValue + 19;
		}

		return returnValue;
	}

	function getGlanceRed()
	{
		var returnValue;
		var glanceRedMin = 0;
		var glanceRedMax = 0;

		if(skillDiff >= 11)
		{
			glanceRedMin = Math.max(0.01, Math.min(1.4 - (0.05 * skillDiff), 0.91));
			glanceRedMax = Math.max(0.01, Math.min(1.3 - (0.03 * skillDiff), 0.99));
		}
		else
		{
			glanceRedMin = Math.max(0.01, Math.min(1.3 - (0.05 * skillDiff), 0.91));
			glanceRedMax = Math.max(0.01, Math.min(1.2 - (0.03 * skillDiff), 0.99));
		}
		
		returnValue = (glanceRedMin + glanceRedMax) / 2;

		return returnValue;
	}

	function getParry()
	{
		var returnParry;

		/*

		If the target is a mob and defense minus weapon skill is 11 or more:
		ParryChance = 5% + (TargetLevel*5 - AttackerSkill) * 0.6%

		If the target is a mob and defense minus weapon skill is 10 or less:
		ParryChance = 5% + (TargetLevel*5 - AttackerSkill) * 0.1%

		If the target is a player:
		ParryChance = PlayerParry + (PlayerDefense - AttackerSkill) * 0.04%
    
    	*/

    	if(skillDiff >= 11)
		{
			returnParry = 5 + (((targetLevel * 5) - weaponSkill) * 0.6);
		}
		else
		{
			returnParry = 5 + (((targetLevel * 5) - weaponSkill) * 0.1);
		}

		returnParry = returnParry - (expertise * 0.25);

		return returnParry;
	}

	function initStatControl()
	{
		var stats = $('.stat_btn');
		stats.on('click', function()
		{
			var btn = $(this);
			var stat_num = btn.parent().prev().text();
			if(btn.hasClass('stat_inc'))
			{
				var stat_num = parseInt(btn.parent().prev().text());
				btn.parent().prev().text(stat_num + 1);
			}
			if(btn.hasClass('stat_dec'))
			{
				var stat_num = parseInt(btn.parent().prev().text());
				if(stat_num > 0)
				{
					btn.parent().prev().text(stat_num - 1);
				}
			}
		});
	}

	function initCheckboxes()
	{
		var boxes = $('.opt_checkbox');
		boxes.on('click', function()
		{
			var box = $(this);
			if(box.hasClass('checked'))
			{
				box.removeClass('checked');
			}
			else
			{
				box.addClass('checked');
			}
		});
	}

});