<div class='panel_btns'>
	<div>
		<a class='btn panel_btn tlsetting_apply'>(i18n_0255)</a>
	</div>
</div>
<div class='tlsetting_items'>
	{if $param->timeline_type=='notifications'}
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0405)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='dn_new_followers' {if $param->dn_new_followers==1}checked{/if}></span>
				<span>(i18n_0406)</span>
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='dn_favourites' {if $param->dn_favourites==1}checked{/if}></span>
				<span>(i18n_0407)</span>
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='dn_mentions' {if $param->dn_mentions==1}checked{/if}></span>
				<span>(i18n_0408)</span>
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='dn_boosts' {if $param->dn_boosts==1}checked{/if}></span>
				<span>(i18n_0409)</span>
			</div>
		</div>
	</div>
	{/if}

	{if $param->timeline_type!='notifications'}
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0002)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				NSFW
			</div>
			<div class='radiocontainer'>
				<div><input type='radio' class='tl_nsfw' name='tl_nsfw_{$uniqueID}' value='0' {if $param->tl_nsfw==0}checked{/if}>(i18n_0003)</div>
				<div><input type='radio' class='tl_nsfw' name='tl_nsfw_{$uniqueID}' value='1' {if $param->tl_nsfw==1}checked{/if}>(i18n_0004)</div>
				<div><input type='radio' class='tl_nsfw' name='tl_nsfw_{$uniqueID}' value='2' {if $param->tl_nsfw==2}checked{/if}>(i18n_0005)</div>
			</div>
		</div>
	</div>
	{/if}
</div>
