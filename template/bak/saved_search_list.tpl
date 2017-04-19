	{foreach item=item from=$items}
	<div class='item'>
		<div class='query' sid='{$item->id}' query='{$item->query}'>{$item->query}</div>
		<div class='buttons'><a class='btn delbtn'>(i18n_0223)</a></div>
	</div>
	{/foreach}
