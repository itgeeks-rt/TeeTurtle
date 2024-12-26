import {
    Box,
    InlineGrid,
    Thumbnail,
    Checkbox,
    Scrollable,
    TextField,
    Text,
    Icon,
    Spinner,
    Button,
    EmptySearchResult,
    Pagination,
    InlineStack
} from "@shopify/polaris";

import '../assets/styles.css';
import variable from '../Variable';
import { useState, useEffect } from "react";
import { SearchIcon } from '@shopify/polaris-icons';


export default function LogoLibrary({setSelectLogoFromLibrary, setIsModalButtonClick, setLogoName, logoBlob}) {

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const [selectedLogo, setSelectedLogo] = useState(logoBlob);
    const [fetchImages, setFetchImages] = useState([]);
    const [loadingSpinner, setLoadingSpinner] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); 
    const [selectedImageLink, setSelectedImageLink] = useState(null); 
    const [selectedLogoName, setSelectedLogoName] = useState(null); 
    const [searchValue, setSearchValue] = useState("");
    const [pagination, setPagination] = useState([]);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [requestBody, setRequestBody] = useState({
        page: 1,
        limit: 7,
    });

    // Fetch logo images from the server using AJAX
    useEffect(() => {
        setLoadingSpinner(true);
        fetch(`${variable.baseUrl}/external/logo/logoList?shop=${variable.shopUrl}`,
            {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: myHeaders,
                redirect: 'follow',
            }
        )
        .then((res) => res.json())
        .then((data) => {
            const items = data?.result.rows || [];
            const itemPagination = data?.result.pagination || [];
            setPagination(itemPagination);
            setFetchImages(items);
            setLoadingSpinner(false);
        })
        .catch((err) => {
            shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
            console.error(err);
        });
    }, [requestBody]);

    // Handle search input change
    const handleSearchChange = (value) => {
        setSearchValue(value);
        const updatedRequestBody = {
            limit: 7,
            page: 1,
            ...(value && value.length >= 0 ? { searchQuery: value } : {}),
        };
        setRequestBody(updatedRequestBody);
    };

    // Handle checkbox change
    const handleCheckboxChange = (imageId, imageLink, imageName) => {
        setSelectedLogo(null);
        setSelectedImage(imageId === selectedImage ? null : imageId);
        setSelectedImageLink(imageId === selectedImage ? false : imageLink);
        setSelectedLogoName(imageId === selectedImage ? false : imageName);
    };

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

    const buttonHandler = () => { 
        setSelectLogoFromLibrary(selectedImageLink);
        setLogoName(selectedLogoName);
        setIsModalButtonClick(false);
    } 
    
    return (
        <Box className="logo-image__bank">
            <Box padding={{ xs: '400', sm: '400' }} borderBlockEndWidth="0165" borderColor="border-brand">
                <TextField
                    prefix={<Icon source={SearchIcon} />}
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Search logos"
                    clearButton
                    onClearButtonClick={() => handleSearchChange("")}
                />
            </Box>
            <Scrollable style={{ height: '500px' }}>
                <Box padding={{ xs: '400', sm: '400' }}>
                    <InlineGrid columns={6} gap="050">
                        {fetchImages.map((image) => (
                            <Box key={image.id}>
                                <div className="logo-image__item" data-checked={selectedImage === image.id || selectedLogo === image.logoURL} onClick={() => handleCheckboxChange(image.id,image.logoURL,image.logoName)}>
                                    <Thumbnail
                                        size="large"
                                        alt={image.logoName}
                                        source={image.logoURL}
                                    />
                                    <Checkbox
                                        id={image.id}
                                        checked={selectedImage === image.id || selectedLogo === image.logoURL}
                                    />
                                    <Text alignment="center">{image.logoName}</Text>
                                </div>
                            </Box>
                        ))}
                    </InlineGrid>
                </Box>
                {loadingSpinner ? (
                    <Box as="span" className="box-center__center" position="absolute" zIndex="1">
                        <Spinner accessibilityLabel="Loading Spinner" size="large" />
                    </Box>
                ): fetchImages.length === 0 && (
                    <Box as="div" className="box-center__center" position="absolute" zIndex="1">
                        <EmptySearchResult
                            title="No Image Found"
                            description="Try changing the filters or search term."
                            withIllustration
                        />
                    </Box>
                )}
            </Scrollable>
            <Box padding={{ xs: '400', sm: '400' }} borderBlockStartWidth="0165" borderColor="border-brand">
                <InlineStack align="space-between">
                    <Pagination
                        label=""
                        hasPrevious={hasPrevious}
                        onPrevious={() => { setRequestBody({ ...requestBody, page: currentPage - 1 }) }}
                        hasNext={hasNext}
                        onNext={() => { setRequestBody({ ...requestBody, page: currentPage + 1}) }}
                    />
                    <Button onClick={() => buttonHandler()} variant="primary" size="large" disabled={selectedImage ? false : true}>Select Image</Button>
                </InlineStack>
            </Box>
        </Box>
    );
}
