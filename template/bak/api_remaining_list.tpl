{foreach item=item from=$items}
	{if $item != undefined}
	<div class='item'>
		<div class='api'><span class='tooltip' tooltip='{$item->api}'>{$item->title}</span></div>
		<div class='limit'>
			<div class='limit_container'>
				<div class='used'></div>
			</div>
			<div class='info'><span class='tooltip' tooltip='(i18n_0290){$item->reltime}'>{$item->remaining}/{$item->limit} ({$item->reset})</span></div>
		</div>
	</div>
	{/if}
{/foreach}
