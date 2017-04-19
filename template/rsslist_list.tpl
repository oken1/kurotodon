	{foreach item=item from=$items}
	<div class='item' id='{$item->id}'>
		<div class='title'><span>{$item->param->title}</span></div>
		<div class='buttons'><a class='btn removebtn'>(i18n_0223)</a></div>
	</div>
	{/foreach}
