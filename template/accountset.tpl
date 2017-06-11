<div id='profedit'>
	<span>(i18n_0015)</span>
	<div>
		<span>(i18n_0016):</span>
		<input type='text' maxlength='32' value='{$name}' id='profname'><span class='info'>((i18n_0017))</span>
	</div>
	<div>
		<span>(i18n_0018):<span class='info'>((i18n_0019))</span></span>
		<textarea id='profdesc'>{$desc}</textarea>
	</div>
	<div>
		<a class='btn' id='profupdatebtn'>(i18n_0255)</a>
	</div>
</div>
<div id='avatarchange'>
	<span>(i18n_0020)</span>
	<div>
		<div>
			<img id='avatarimg' src='{$avatar}'>
		</div>
		<div id='avatarupload_box'>
			<div id='avataruploadbox_select'>
				<span>(i18n_0119)</span>
				<input type='file' id='avatarupload_input' accept='image/jpeg,image/png' name='media'>
			</div>
			<div id='avataruploadbox_btn'>
				<a class='btn img tooltip icon-folder-open' id='avatarselectbtn' tooltip='(i18n_0120)'></a>
				<a class='btn' id='avataruploadbtn'>(i18n_0024)</a>
			</div>
		</div>
	</div>
</div>
<div id='headerchange'>
	<span>(i18n_0021)</span>
	<div>
		<div>
			<img id='headerimg' src='{$header}'>
		</div>
		<div id='headerupload_box'>
			<div id='headeruploadbox_select'>
				<span>(i18n_0119)</span>
				<input type='file' id='headerupload_input' accept='image/jpeg,image/png' name='media'>
			</div>
			<div id='headeruploadbox_btn'>
				<a class='btn img tooltip icon-folder-open' id='headerselectbtn' tooltip='(i18n_0120)'></a>
				<a class='btn' id='headeruploadbtn'>(i18n_0024)</a>
			</div>
		</div>
	</div>
</div>
