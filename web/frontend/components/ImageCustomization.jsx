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
    ButtonGroup
  } from "@shopify/polaris";
  import '../assets/styles.css';
  import { Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
  import { useState, useCallback, useRef} from "react";
  import variable from '../Variable';
  import { useTranslation } from "react-i18next";
  import { NoteIcon } from '@shopify/polaris-icons'; 
  import html2canvas from 'html2canvas';
  import { useNavigate } from 'react-router-dom';


export default function ImageCustomization({imageObject}) {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const baseUrl = variable.Base_Url;
  const shopify = useAppBridge();
  const [uploadLogo, setUploadLogo] = useState(null);
  const [logoBlob, setLogoBlob] = useState(null); 
  const validImageTypes = ["image/jpeg", "image/png"];
  const [logoMaxWidth, setLogoMaxWidth] = useState(50);
  const [logoPositionTop, setLogoPositionTop] = useState(50);
  const [logoPositionLeft, setLogoPositionLeft] = useState(50);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isButtonNavigate, setIsButtonNavigate] = useState(false);

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


  const clearModalValues = () => {
    setLogoMaxWidth(50);
    setLogoPositionTop(50);
    setLogoPositionLeft(50);
    setUploadLogo(null);
    setLogoBlob(null); 
    setIsButtonDisabled(true);
    setIsButtonNavigate(false);
  }
 
  /* Logo upload for customization */
  const handleDropZoneLogo = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];
    const maxSize = 1 * 1024 * 1024;
    if (file && validImageTypes.includes(file.type) && file.size <= maxSize) {
      setUploadLogo(file);
      const logoBlob = validImageTypes.includes(file.type) ? window.URL.createObjectURL(file) : NoteIcon;
      setLogoBlob(logoBlob); 
      setIsButtonDisabled(false);
    } else {
      setUploadLogo(null); 
      setLogoBlob(null); 
      shopify.toast.show('Maximum file size is 1MB', { isError: true });
      setIsButtonDisabled(true);
    }
  }, []); 

  const takeScreenshot = async (type) => {
    if (mediaRef.current) {
      type == 'saved'? setIsButtonLoading(true): null; 
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
          const link = document.createElement('a');
          link.href = finalImage;
          link.download = 'Personalized.jpg';
          link.click();
          return;
        }
        const base64Image = finalImage.split(',')[1];
        await uploadImage(base64Image);
      } catch (error) {
        console.error('Error generating screenshot:', error);
      }
    }
  };


  const uploadImage = async (base64Image) => {
    const requesUploadBody = {
      imageName: imageObject.imageName,
      category: imageObject.category,  
      fileBase64: base64Image,
      personalized: true
    };
    try {
      const response = await fetch(`${baseUrl}/external/image/uploadImage?shop=itgeeks-test.myshopify.com`, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(requesUploadBody),
      });
      const data = await response.json();
      if(data && data.status){  
        shopify.toast.show('Image uploaded successfully.', { duration: 5000});
        setIsButtonNavigate(true);
      }else if (data && data.message){
        shopify.toast.show(data.message, {isError: true,}); 
      }
      setIsButtonLoading(false);
    } catch (error) {
      setIsButtonLoading(false);
      shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
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
    <Modal id="customize-image" variant="max" onHide={clearModalValues}>
        <Box padding={{ xs: '400', sm: '1000' }}>
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
                  src={imageObject.imageURL}
                />
                {logoBlob && (
                  <div className="logo-container" style={{position: "absolute", top: `${Math.min(logoPositionTop, 100)}%`, left: `${Math.min(logoPositionLeft, 100)}%`, maxWidth: `${logoMaxWidth}px`, width: '100%', transform: "translate(-50%, -50%)"}}>
                      <img src={logoBlob} crossOrigin="anonymous" alt="Uploaded Logo" style={{width: '100%', height: 'auto' }} />
                  </div>
                )}
              </Box> 
            </Box>
            <BlockStack gap="500">
              <DropZone label="Upload your logo" onDrop={handleDropZoneLogo} accept={validImageTypes} variableHeight>
                  {uploadLogoFile}
                  {logoUpload} 
              </DropZone>
              <BlockStack gap="500">
                <Card>
                  <RangeSlider
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
                    label="Logo position top"
                    value={logoPositionTop}
                    onChange={handleChangeLogoPositionTop}
                    output
                  />
                </Card>
                <Card>
                  <RangeSlider
                    label="Logo position left"
                    value={logoPositionLeft}
                    onChange={handleChangeLogoPositionLeft}
                    output
                  />
                </Card>
                <ButtonGroup>
                  {isButtonNavigate ? (
                    <Button 
                      variant="primary" 
                      size="large" 
                      disabled={isButtonDisabled}
                      onClick={() => navigate("/personalization")} 
                    >
                      Go To Personalized Template
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="large" 
                      onClick={() => takeScreenshot('saved')}  
                      loading={isButtonLoading} 
                      disabled={isButtonDisabled}
                    >
                      Save Personalized Template
                    </Button>
                  )}
                  <Button variant="secondary" size="large" onClick={() => takeScreenshot('download')} disabled={isButtonDisabled}>Download Personalized Template</Button>
                </ButtonGroup>
              </BlockStack>
            </BlockStack>
          </InlineGrid>
        </Box>
        <TitleBar title="Template Image Personalizer"></TitleBar>
    </Modal>  
  );
}
