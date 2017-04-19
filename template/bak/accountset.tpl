<div id='iconchange'>
	<span>(i18n_0043)</span>
	<div>
		<div>
			<img id='iconimg' src='{$icon}'>
		</div>
		<div id='iconupload_box'>
			<div id='iconuploadbox_select'>
				<span>(i18n_0119)<br><span class='info'>(i18n_0019)</span></span>
				<input type='file' id='iconupload_input' accept='image/jpeg,image/png' name='media'>
			</div>
			<div id='iconuploadbox_btn'>
				<a class='btn img tooltip icon-folder-open' id='iconselectbtn' tooltip='(i18n_0120)'></a>
				<a class='btn' id='iconuploadbtn'>(i18n_0050)</a>
			</div>
		</div>
	</div>
</div>
<div id='profedit'>
	<span>(i18n_0148)</span>
	<div>
		<span>(i18n_0281):</span>
		<input type='text' maxlength='20' value='{$name}' id='profname'><span class='info'>(20(i18n_0015))</span>
	</div>
	<div>
		<span>(i18n_0040):</span>
		<input type='text' maxlength='100' value='{$url}' id='profurl'><span class='info'>(100(i18n_0015))</span>
	</div>
	<div>
		<span>(i18n_0233):</span>
		<input type='text' maxlength='30' value='{$location}' id='proflocation'><span class='info'>(30(i18n_0015))</span>
	</div>
	<div>
		<span>(i18n_0227):<span class='info'>(160(i18n_0015))</span></span>
		<textarea id='profdesc'>{$desc}</textarea>
	</div>
	<div>
		<a class='btn' id='profupdatebtn'>(i18n_0278)</a>
	</div>
</div>
