import {
  Page,
  EmptySearchResult,
  ButtonGroup,
  Button,
  Thumbnail,
  IndexTable,
  Box,
  Text,
  Card,
  TextField,
  Icon,
  useBreakpoints,
  Spinner,
  FormLayout,
  DropZone,
  useIndexResourceState,
  BlockStack,
  Tooltip
} from "@shopify/polaris";
import '../assets/styles.css';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon, SearchIcon, NoteIcon, LinkIcon, CheckIcon } from '@shopify/polaris-icons';

export default function LogoLibrary() {
  const { t } = useTranslation();
  const listLimit = 10;
  const shopify = useAppBridge();

  // State variables for managing images, pagination, form inputs, and loading states
  const [imageName, setImageName] = useState("");
  const [fetchImages, setFetchImages] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [buttonRemoveLoading, setButtonRemoveLoading] = useState(false);
  const [loadingSpinner, setLoadingSpinner] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState("");
  const [removeImageId, setRemoveImageId] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const [requestBody, setRequestBody] = useState({
    color: "empty",
    category: "empty",
    page: 1,
    limit: listLimit,
  });

  const validImageTypes = ["image/jpeg", "image/png"];
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json")


  /* Fetch template images from the server using AJAX */
  useEffect(() => {
    setLoadingSpinner(true);
    fetch(`${variable.baseUrl}/external/logo/logoList?shop=${variable.shopUrl}`, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: myHeaders,
      redirect: 'follow' 
    })
      .then((res) => res.json())
      .then((data) => {
        clearSelection();
        const items = data?.result.rows || [];
        const itemPagination = data?.result.pagination || [];
        const colors = data?.result.colors || [];
        setPagination(itemPagination);
        setFetchImages(items); 
        setLoadingSpinner(false);
      })
      .catch((err) => {
        shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
        console.error(err)
      });
  }, [requestBody]);

  /* Update pagination status based on the response */
  useEffect(() => {
    if (pagination && pagination.count > pagination.per_page) {
      const totalPages = Math.ceil(pagination.count / pagination.per_page);
      setHasNext(pagination.current_page < totalPages);
      setHasPrevious(pagination.current_page > 1);
      setCurrentPage(pagination.current_page);
    } else {
      setHasNext(false);
      setHasPrevious(false);
    }
  }, [pagination]);

  /* Handle search input change and fetch updated list of images */
  const handleSearchChange = (value) => {
    setSearchValue(value);
    const updatedRequestBody = {
      page: 1,
      limit: listLimit,
      ...(value && value.length >= 0 ? { searchQuery: value } : {}),
    };
    setRequestBody(updatedRequestBody);
  };

  /* Image upload form validation */
  const validateForm = (name, uploadFile) => {
    setIsButtonEnabled(name && uploadFile);
  };

  /* Convert file to Base64 for upload */
  const convertToBase64 = (uploadFile) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFileBase64(reader.result.split(',')[1]); // Save base64 encoded string
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleCopyLink = (id, link) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* Handle file drop event */
  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];
    const maxSize = 5 * 1024 * 1024;
    if (file && validImageTypes.includes(file.type) && file.size <= maxSize) {
      setUploadFile(file);
      validateForm(imageName, file);
      convertToBase64(file);
    } else {
      setUploadFile(null);
      setUploadedFileBase64("");
      validateForm(imageName, null);
      shopify.toast.show('Maximum file size is 5MB', { isError: true });
    }
  }, [imageName]);

  /* Handle image upload submission */
  const handleSubmit = () => {
    setIsButtonLoading(true);
    const requesUploadBody = {
      logoName: imageName,
      logoBase64: uploadedFileBase64,
    };

    fetch(`${variable.baseUrl}/external/logo/uploadLogo?shop=${variable.shopUrl}`, {
      method: "POST",
      body: JSON.stringify(requesUploadBody),
      headers: myHeaders,
      redirect: 'follow'
    })
    .then((res) => res.json())
    .then((data) => {
      setIsButtonLoading(false);
      if (data && data.status) {
        shopify.modal.hide('upload-image');
        shopify.toast.show('Image template created successfully.', { duration: 5000 });
        setRequestBody({ page: 1, limit: listLimit });
        resetForm();
      } else if (data && data.message) {
        shopify.toast.show(data.message, { isError: true, });
      }
    })
    .catch((err) => {
      setIsButtonEnabled(false);
      console.error(err)
      shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
    });
  };

  /* Reset form state after successful upload */
  const resetForm = () => {
    setImageName("");
    setUploadFile(null);
    setUploadedFileBase64("");
    setIsButtonEnabled(false);
  };


  /* Handle image deletion */
  const deleteSelectedFiles = () => {
    const imagesToRemove = fetchImages.filter((image) =>
      selectedResources.includes(image.id)
    );
    const imageIdsToRemove = imagesToRemove.map(image => image.logoId);
    if(imageIdsToRemove.length){
      setButtonRemoveLoading(true);
      const requestDeleteBody = {
        logoIds: imageIdsToRemove,
      };
      fetch(`${variable.baseUrl}/external/logo/deleteLogo?shop=${variable.shopUrl}`, {
        method: "DELETE",
        body: JSON.stringify(requestDeleteBody),
        headers: myHeaders,
        redirect: 'follow'
      })
      .then((res) => res.json())
      .then((data) => {
        setButtonRemoveLoading(false);
        clearSelection();
        if (data && data.status) {
          shopify.toast.show('Image template removed successfully.', {
            duration: 5000,
          });
          setRequestBody({ page: currentPage, limit: listLimit});
        } else if (data && data.message) {
          shopify.toast.show(data.message, { isError: true });
        }
      })
      .catch((err) => {
        shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
        console.error(err)
      });
    }
  };

  const imageNameInput = (value) => {
    setImageName(value);
    validateForm(value, uploadedFile);
  };

  const fileUpload = !uploadFile && <DropZone.FileUpload actionHint="Accepts only .jpg and .png" />;
  const uploadedFile = uploadFile && (
    <Box as="div" padding={{ xs: '400', sm: '400' }}>
      <BlockStack gap="150" inlineAlign="center" align="center">
        <Thumbnail
          size="small"
          alt={uploadFile.name}
          source={
            validImageTypes.includes(uploadFile.type)
              ? window.URL.createObjectURL(uploadFile)
              : NoteIcon
          }
        />
        <Text variant="bodySm" as="p">
          {uploadFile.name}{' '}
        </Text>
        <Button
          variant="plain"
          tone="critical"
          onClick={() => {
            setUploadFile(null);
            validateForm(imageName, colorName, selected, null);
          }}
        >
          Change
        </Button>
      </BlockStack>
    </Box>
  );

  const { selectedResources, allResourcesSelected, handleSelectionChange, removeSelectedResources, clearSelection } = useIndexResourceState(fetchImages);

  // Update the disabled state of the button whenever selectedResources changes
  useEffect(() => {
    if (removeImageId.length) {
      removeSelectedResources(removeImageId)
      setRemoveImageId([]);
    }
  }, [removeImageId]);

  useEffect(() => {
    if (copiedId) {
      removeSelectedResources([copiedId])
    }
  }, [copiedId]);

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No Results Found'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );

  const promotedBulkActions = [
    {
      content: <Button variant="monochromePlain" loading={buttonRemoveLoading} icon={DeleteIcon}>Delete file</Button>,
      destructive: true, 
      onAction: () => deleteSelectedFiles()
    }
  ];

  const resourceName = {
    singular: 'image',
    plural: 'images',
  };

  const rowMarkup = fetchImages.map(
    (
      { id, logoName, logoURL, createdAt, logoId },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={logoId}
        position={index}
        selected={selectedResources.includes(id)}
      >
        <IndexTable.Cell>
          <Thumbnail

            source={logoURL}
            alt=""
          />
        </IndexTable.Cell>
        <IndexTable.Cell >
          <Text alignment="flex">
            {logoName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="">
            {createdAt}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell className="template-action__button">
          <ButtonGroup>
            <Tooltip content="Copy Link">
              <Button
                variant="tertiary"
                size="micro"
                onClick={() => handleCopyLink(id, logoURL)}
              >
                <Icon source={copiedId === id ? CheckIcon : LinkIcon} />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page
      title="Logo Library"
      primaryAction={{ content: "Create new Logo", onAction: () => shopify.modal.show('upload-image') }}
    >
      <Modal id="upload-image">
        <Box padding={{ xs: '400', sm: '400' }}>
          <FormLayout>
            <TextField
              label="Logo Name (Maximum of 15 character)"
              maxLength="15"
              value={imageName}
              onChange={imageNameInput}
              placeholder="Logo Name"
              clearButton
              onClearButtonClick={() => imageNameInput("")}
            />
            <DropZone onDrop={handleDropZoneDrop} accept={validImageTypes} variableHeight>
              {uploadedFile}
              {fileUpload}
            </DropZone>
          </FormLayout>
        </Box>
        <Box padding={{ xs: '400', sm: '400' }} borderBlockStartWidth="0165" borderColor="border-brand">
          <BlockStack as="div" inlineAlign="end">
            <Button variant="primary"
              disabled={!isButtonEnabled}
              onClick={handleSubmit}
              loading={isButtonLoading}>
              Upload Logo
            </Button>
          </BlockStack>
        </Box>
        <TitleBar title="Upload a new logo"></TitleBar>
      </Modal>
      <Card padding={{ xs: '0', sm: '0' }}>
        <Box padding={{ xs: '400', sm: '400' }}>
          <TextField
            prefix={<Icon source={SearchIcon} />}
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            clearButton
            onClearButtonClick={() => handleSearchChange("")}
          />
        </Box>
        <Box position="relative">
          <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={fetchImages.length}
            emptyState={emptyStateMarkup}
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            promotedBulkActions={promotedBulkActions}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Name" },
              { title: "Create Date", alignment: "" },
              { title: "Action", alignment: "end" },
            ]}
            selectable={true}
            pagination={{
              hasPrevious: hasPrevious,
              hasNext: hasNext,
              onNext: () => setRequestBody({ ...requestBody, page: currentPage + 1}),
              onPrevious: () => setRequestBody({ ...requestBody, page: currentPage - 1}),
            }}
          >
            {rowMarkup}
          </IndexTable>
          {loadingSpinner && (
            <Box as="span" className="box-center__center" position="absolute">
              <Spinner accessibilityLabel="Loading Spinner" size="large" />
            </Box>
          )}
        </Box>
      </Card>
    </Page>
  );
}
