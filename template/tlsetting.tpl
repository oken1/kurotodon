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
</div>
