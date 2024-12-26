import {
    Box,
    Card,
    DropZone,
    InlineGrid,
    BlockStack,
    Thumbnail,
    Button,
    Text,
    RangeSlider,
    InlineStack,
    ButtonGroup,
    TextField,
    Icon
  } from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
import { useState, useCallback, useRef, useEffect} from "react";
import variable from '../Variable';
import { useTranslation } from "react-i18next";
import { NoteIcon, XSmallIcon, CheckCircleIcon } from '@shopify/polaris-icons'; 
import html2canvas from 'html2canvas';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import LogoLibrary from '../components/LogoLibrary'


export default function ImageCustomization({imageObjectData}) {
  const { t } = useTranslation();

  const imageObject = imageObjectData.rows;
  const imageLength = parseInt(imageObject.length);
  const shopify = useAppBridge();
  const [selectedImage, setSelectedImage] = useState(imageObject[0].imageURL);
  const [uploadLogo, setUploadLogo] = useState(null);
  const [logoName, setLogoName] = useState(null);
  const [logoBlob, setLogoBlob] = useState(null); 
  const [logoBlobBase64, setLogoBlobBase64] = useState(null); 
  const validImageTypes = ["image/jpeg", "image/png"];
  const [logoMaxWidth, setLogoMaxWidth] = useState(50);
  const [logoPositionTop, setLogoPositionTop] = useState(50);
  const [logoPositionLeft, setLogoPositionLeft] = useState(50);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [imageStatus, setImageStatus] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isButtonNavigate, setIsButtonNavigate] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedFilesCount, setSavedFilesCount] = useState(0);
  const [disableActions, setDisableActions] = useState(false);
  const [downloadImageObject, setDownloadImageObject] = useState([]);
  const [isModalButtonClick, setIsModalButtonClick] = useState(false);
  const [selectLogoFromLibrary, setSelectLogoFromLibrary] = useState(false);
  const [imageGroupName, setImageGroupName] = useState("");

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
 
  const mediaRef = useRef(null);

  const handleChangeLogoSize = (value) => {
    setLogoMaxWidth(value);
  }
  const handleChangeLogoPositionTop = (value) => {
    setLogoPositionTop(value);
  }
  const handleChangeLogoPositionLeft = (value) => {
    setLogoPositionLeft(value);
  }

  const imageGroupTitleChange = (value) => {
    setImageGroupName(value);
  }
  

  const handleThumbnailClick = (index,item) => {
    setActiveIndex(index);
    setSelectedImage(item.imageURL);
  }; 
 
  /* Logo upload for customization */
  const handleDropZoneLogo = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];
    const maxSize = 1 * 1024 * 1024;
    if (file && validImageTypes.includes(file.type) && file.size <= maxSize) {
      setIsButtonNavigate(false);
      setUploadLogo(file);
      setLogoName(file.name);
      const logoBlob = validImageTypes.includes(file.type) ? window.URL.createObjectURL(file) : NoteIcon;
      setLogoBlob(logoBlob); 

      const reader = new FileReader(); 
      reader.onloadend = () => {
        setLogoBlobBase64(reader.result.split(',')[1]); // Save base64 encoded string
      };
      reader.readAsDataURL(file);
      setIsButtonDisabled(false);
    } else {
      setLogoName(null);
      setUploadLogo(null); 
      setLogoBlob(null); 
      setLogoBlobBase64(null);
      shopify.toast.show('Maximum file size is 1MB', { isError: true });
      setIsButtonDisabled(true);
    }
  }, []); 

  const modalLogoLibrary = () => {
    setIsModalButtonClick(true);
  }

  /* Download images in zip */
  useEffect(() => {
    const createZip = async () => {
      if (downloadImageObject.length === imageLength) {
        try {
          const zip = new JSZip();
          const folder = zip.folder("Personalizer");
          downloadImageObject.forEach((image) => {
            const base64Data = image.base64.split(",")[1];
            folder.file(`${image.name}.jpg`, base64Data, { base64: true });
          });
          const zipContent = await zip.generateAsync({ type: "blob" });
          saveAs(zipContent, "Personalizer.zip");
          setDownloadImageObject([]);
        } catch (error) {
          console.error("Error creating ZIP file:", error);
        }
      }
    };
    createZip();
  }, [downloadImageObject, imageLength]); 


  useEffect(() => {
    if(selectLogoFromLibrary){
      setLogoBlob(selectLogoFromLibrary);
      setSelectLogoFromLibrary(false);
      setIsButtonDisabled(false);
      setIsButtonNavigate(false);
      setSavedFilesCount(0);
      setUploadLogo(null);
    }
  },[selectLogoFromLibrary])

 
  const takeScreenshotApi = async(type) => {
    setSavedFilesCount(0);
    type == 'saved'? setIsButtonLoading(true): null;
    setDownloadImageObject([]);
    setDisableActions(true); 
    setImageStatus(true);
    for (let index in imageObject){
      let itemIndex = parseInt(index)
      setActiveIndex(parseInt(itemIndex));
      let item = imageObject[itemIndex];
      setSelectedImage(item.imageURL);
      await new Promise(resolve => setTimeout(resolve, 100));
      await takeScreenshot(item, itemIndex+1, type);
      setSavedFilesCount(itemIndex+1);
    }
  }
  const takeScreenshot = async (item, itemIndex, type) => {
    if (mediaRef.current) {
      try {
        const canvas = await html2canvas(mediaRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });
  
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
  
        let top = canvas.height,
          left = canvas.width,
          right = 0,
          bottom = 0;
  
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3]; 
            if (alpha > 0) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }
  
        const trimmedWidth = right - left + 1;
        const trimmedHeight = bottom - top + 1;
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimmedWidth;
        trimmedCanvas.height = trimmedHeight;
  
        const trimmedCtx = trimmedCanvas.getContext('2d');
        trimmedCtx.putImageData(
          ctx.getImageData(left, top, trimmedWidth, trimmedHeight),
          0,
          0
        );
  
        const finalImage = trimmedCanvas.toDataURL('image/png', 1.0);
        if(type == 'download'){
          setDownloadImageObject((prevImages) => [
            ...prevImages,
            { base64: finalImage, name: item.color },
          ]);
          if(itemIndex == imageLength){
            setIsButtonLoading(false);
            setDisableActions(false); 
            setTimeout(() => {
              setImageStatus(false);
            }, 5000);
          }
          return;
        }
        const base64Image = finalImage.split(',')[1];
        await uploadImage(base64Image,item, itemIndex);
      } catch (error) {
        console.error('Error generating screenshot:', error);
      }
    }
  };
  
  const uploadImage = async (base64Image,item, itemIndex) => {
    const requestUploadBody = {
      imageName: imageGroupName?imageGroupName:item.name,
      category: item.category,  
      colorName: item.color,  
      fileBase64: base64Image,
      personalized: true,
      logoBase64: logoName != uploadLogo?.name ? null : logoBlobBase64,
      logoName: logoName,
      logoMimeType: uploadLogo?.type
    };

    try {
      const response = await fetch(`${variable.baseUrl}/external/image/uploadImage?shop=${variable.shopUrl}`, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(requestUploadBody),
      });
      const data = await response.json();
      if (data && !data.status && data.message){
        console.error(data.message);
      }
      if(itemIndex == imageLength){
        setIsButtonLoading(false);
        setIsButtonNavigate(true);
        setDisableActions(false); 
        setTimeout(() => {
          setImageStatus(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Something went wrong. Please try again later.');
      if(itemIndex == imageLength){
        setIsButtonLoading(false);
        setDisableActions(false); 
        setTimeout(() => {
          setImageStatus(false);
        }, 5000);
      }
    }
  };


  const logoUpload = !uploadLogo && <DropZone.FileUpload actionHint="Accepts only .jpg and .png" />;
  const uploadLogoFile = uploadLogo && (
    <Box as="div" padding={{ xs: '400', sm: '400' }}>
      <BlockStack gap="150" inlineAlign="center" align="center">
        <Thumbnail
          size="small"
          alt={uploadLogo.name}
          source={
            validImageTypes.includes(uploadLogo.type)
              ? window.URL.createObjectURL(uploadLogo)
              : NoteIcon
          }
        />
        <Text variant="bodySm" as="p">
          {uploadLogo.name}{' '}
        </Text>
        <Button
          disabled={disableActions}
          variant="plain" 
          tone="critical"
          onClick={() => {
            setUploadLogo(null);
            setLogoBlob(null); 
            setIsButtonDisabled(true);
            setIsButtonNavigate(false);
          }}
        >
          Change
        </Button>
      </BlockStack> 
    </Box> 
  );

  return (
    <Box padding={{ xs: '400', sm: '1000' }}>
      <Modal open={isModalButtonClick} variant="large" onHide={() => setIsModalButtonClick(false)}>
        {isModalButtonClick && (
          <LogoLibrary setSelectLogoFromLibrary={setSelectLogoFromLibrary} setLogoName={setLogoName} logoBlob={logoBlob} setIsModalButtonClick={setIsModalButtonClick}/>
        )}
        <TitleBar title="Select Logo For Personalize"></TitleBar>
      </Modal>
      <InlineGrid gap="1000" columns={{xs: 1, sm: 1, md: 2, lg: 2}}>
        <Box className="personalization-image__box"> 
          <Box ref={mediaRef} className="personalization-image__media">
            <img
              alt=""
              width="100%"
              height="100%"
              style={{
                  objectFit: 'contain',  
                  objectPosition: 'center center',
              }}
              src={selectedImage}
            />
            {logoBlob && (
              <div className="logo-container" style={{position: "absolute", top: `${Math.min(logoPositionTop, 100)}%`, left: `${Math.min(logoPositionLeft, 100)}%`, maxWidth: `${logoMaxWidth}px`, width: '100%', transform: "translate(-50%, -50%)"}}>
                  <img src={logoBlob} crossOrigin="anonymous" alt="Uploaded Logo" style={{width: '100%', height: 'auto' }} />
              </div>
            )}
          </Box> 
        </Box>
        <BlockStack gap="500"> 
          <InlineStack wrap={false} align="space-between">
              <Text as="h2" variant="headingLg">Personalize your Image</Text>
              <Button variant="primary" onClick={() => modalLogoLibrary()} disabled={disableActions}>Logo Library</Button>
          </InlineStack>
          <DropZone label="Upload new logo"  onDrop={handleDropZoneLogo} accept={validImageTypes} variableHeight disabled={disableActions}>
              {uploadLogoFile}
              {logoUpload} 
          </DropZone>
          <BlockStack gap="500">
            <InlineGrid columns={3} gap="200">
              <Card>
                <RangeSlider
                  disabled={disableActions}
                  label="Logo size" 
                  min={50}
                  max={250}
                  value={logoMaxWidth}
                  onChange={handleChangeLogoSize}
                  output
                />
              </Card>
              <Card>
                <RangeSlider
                  disabled={disableActions}
                  label="Logo position top"
                  value={logoPositionTop}
                  onChange={handleChangeLogoPositionTop}
                  output
                />
              </Card>
              <Card>
                <RangeSlider
                  disabled={disableActions}
                  label="Logo position left"
                  value={logoPositionLeft}
                  onChange={handleChangeLogoPositionLeft}
                  output
                />
              </Card>
            </InlineGrid>
            <TextField
                label="Personalize Group Name"
                size="medium"
                maxLength={20}
                value={imageGroupName}
                onChange={imageGroupTitleChange}
                clearButton
                onClearButtonClick={() => imageGroupTitleChange("")}
                disabled={disableActions}
            />
            <Box className={disableActions ? 'image-media__list disabled' : 'image-media__list'}>
              {imageObject?.map((item, index) => (
                <Box as="span" 
                  key={index}
                  onClick={() => handleThumbnailClick(index,item)}
                  className={activeIndex === index ? 'swatch-image active' : 'swatch-image'}
                >
                  <Thumbnail
                    className="asdd"
                    size="Medium"
                    alt={item.name}
                    source={item.imageURL}
                    category={item.category}
                    color={item.color}
                  />
                  <Text variant="bodySm" alignment="center" as="p">{item.color}</Text>
                </Box>
              ))}
            </Box>
            <ButtonGroup>
              {isButtonNavigate ? (
                <Button 
                  variant="primary" 
                  size="large" 
                  disabled={isButtonDisabled}
                  onClick={() =>  window.open(variable.shopAppUrl+'/personalization', '_parent')} 
                >
                  Go To Personalized Template
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  size="large" 
                  onClick={() => takeScreenshotApi('saved')}  
                  loading={isButtonLoading} 
                  disabled={isButtonDisabled}
                >
                 {imageLength > 1 ? 'Save All Templates': 'Save Template'}
                </Button>
              )}
              <Button variant="secondary" size="large" onClick={() => takeScreenshotApi('download')} disabled={isButtonDisabled}>{imageLength > 1 ? 'Download All Template': 'Download Template'}</Button>
            </ButtonGroup>
          </BlockStack>
        </BlockStack>
      </InlineGrid>
      {imageStatus && (
        <Box position="fixed" 
          insetBlockEnd="500" 
          insetInlineEnd="500" 
          background="bg-fill-brand-active" 
          color="text-brand-on-bg-fill" 
          padding="300" 
          borderRadius="200">
            {savedFilesCount === imageLength ? (
              <InlineStack gap="150">
                <Icon
                  source={CheckCircleIcon}
                  tone="success"
                />
                <Text fontWeight="bold">
                  All Templates Saved Successfully
                </Text>
                <Button icon={XSmallIcon} variant="monochromePlain" onClick={() => setImageStatus(false)}/>
              </InlineStack>
            ) : (
              <Text fontWeight="bold">
                {savedFilesCount} Template Saved, {imageLength - savedFilesCount} Remaining
              </Text>
            )}
        </Box>
      )}
    </Box>
  );
}
