<div class='item' status_id='{$status_id}' created_at='{$created_at}'>
	<div class='avatar'>
		<img src='{$avatar}'>
	</div>
	<div>
		{if $type=='follow'}(i18n_0372)
		{elseif $type=='favourite'}(i18n_0373)
		{elseif $type=='reblog'}(i18n_0374)
		{elseif $type=='mention'}
		{/if}
	</div>
</div>
